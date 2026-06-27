# Backend Architecture — cost-optimized for AWS Free Tier

Mục tiêu: chạy trong **Free Tier**, hóa đơn AWS định kỳ ≈ **$0**. Chi phí bắt
buộc duy nhất là **tên miền** (~$10–15/năm). Region: **eu-central-1** (Frankfurt).

Stack tổng thể đã chốt trong context dự án (Amplify · Cognito · S3 · CloudFront ·
Lambda · DynamoDB). Tài liệu này là **thiết kế chi tiết** + các lựa chọn để giữ $0.

> **Loại tài khoản (quan trọng):** Từ 15/07/2025 AWS đổi chương trình — tài khoản
> mới chọn **Free Plan** (credit $100–200, **hết hạn sau 6 tháng**, chỉ để thử
> nghiệm) hoặc **Paid Plan**. Site production **phải dùng Paid Plan ngay từ đầu**.
> Trên Paid Plan ta vẫn hưởng các tier **always-free** (CloudFront, Lambda,
> DynamoDB, Cognito) → đó là phần cho **$0 vĩnh viễn**; còn S3 / Amplify /
> CloudWatch chỉ free 12 tháng đầu, sau đó vài cent/tháng. Đặt Budget + Cost
> Anomaly Detection để an toàn.

---

## 1. Nguyên tắc tối ưu chi phí (quyết định then chốt)

| Quyết định | Lý do cost |
|---|---|
| **Lambda Function URL** thay vì API Gateway | Function URL **không tính phí riêng** (chỉ trả tiền Lambda). API Gateway REST $3.50/triệu, HTTP API $1.00/triệu sau free tier. |
| **1 Lambda "api" duy nhất** (router nội bộ) cho mọi route | Ít cold start, đơn giản; nằm gọn trong 1 triệu lượt/tháng miễn phí vĩnh viễn. |
| **DynamoDB provisioned 5 RCU / 5 WCU** (trong mức always-free 25/25) | Đảm bảo **$0 vĩnh viễn**. (On-demand cũng gần $0 ở lưu lượng này — xem §4.) |
| **Lambda xử lý ảnh chạy theo S3 event** (chỉ khi upload) | ~vài trăm lần gọi cả vòng đời, không phải mỗi lượt xem → ~$0. |
| **CloudFront phục vụ ảnh** | Always-free **1 TB ra + 10 triệu request/tháng** → ảnh gần như miễn phí. |
| **Cognito** chỉ cho chủ shop | Free tier 10.000 MAU → $0. |
| **CAPTCHA: Cloudflare Turnstile** (hoặc hCaptcha) | Miễn phí; verify trong Lambda. |
| **KHÔNG đặt Lambda trong VPC** | Tránh NAT Gateway (~$32/tháng — đắt nhất nếu lỡ bật). |
| **KHÔNG dùng Route 53 hosted zone** nếu được | Tiết kiệm $0.50/tháng → trỏ DNS tại nhà đăng ký tên miền. |

---

## 2. Sơ đồ

```
                ┌─────────────┐
   Khách  ─────▶│  CloudFront │──▶ S3 (public/ : WebP)        [đọc ảnh]
                └─────────────┘
                ┌─────────────────────┐
   Khách/Admin ▶│ Lambda Function URL │──▶ DynamoDB           [API]
                │   (Lambda "api")    │──▶ S3 (presigned)
                └─────────────────────┘
   Admin login ▶ Cognito User Pool  (Lambda verify JWT qua JWKS)

   Upload:  admin ─presigned PUT─▶ S3 uploads/ ──event──▶ Lambda "image-processor"
                                                            └─▶ S3 public/ (WebP) + DynamoDB
   Frontend: Amplify Hosting (Next.js)
```

Chỉ **2 Lambda**: `api` (Function URL) và `image-processor` (S3 trigger).

---

## 3. Thiết kế từng phần

### 3.1 DynamoDB — single table `FlowerShop`
Provisioned 5 RCU / 5 WCU. Cursor phân trang = base64 của `LastEvaluatedKey`.

> **Capacity & always-free:** Mức always-free 25 WCU / 25 RCU áp cho chế độ
> **provisioned** và tính **gộp bảng gốc + GSI**. Phải provision riêng RCU/WCU cho
> GSI1 → giữ tổng (gốc + GSI) ≤ 25 mỗi loại để vẫn $0 (vd 5/5 bảng gốc + 5/5 GSI).
> **On-demand** đơn giản hơn và ở lưu lượng này gần như $0 (~vài phần nghìn đô),
> bù lại không có tier always-free cho request — chọn provisioned nếu muốn $0 tuyệt đối.

**Comments**
- `PK = "COMMENT"`, `SK = "<createdAt ISO8601>#<id>"` → query mới nhất trước (`ScanIndexForward=false`).
- Thuộc tính: `name, email, content, status ("visible"|"hidden"), replyContent?, replyCreatedAt?`.
- **GSI1 `byStatus`**: `GSI1PK = "CMT#<status>"`, `GSI1SK = "<createdAt>"`.
  - Public `GET /comments` → query GSI1 với `CMT#visible` (không quét bình luận ẩn, không lộ email).
  - Admin `GET /admin/comments` → query bảng gốc (toàn bộ, kèm email).
  - Đổi `status` → cập nhật `GSI1PK` để vào/ra feed public.

**Images**
- `PK = "IMAGE"`, `SK = "<createdAt>#<id>"`.
- Thuộc tính: `objectKey, url (CloudFront), width, height, alt?, sizeBytes, status ("processing"|"active")`.

> Email **chỉ** đọc ở route admin. Public không bao giờ chạm tới.

### 3.2 Lambda `api` (Function URL, Node.js + TypeScript)
Một handler route nội bộ theo method + path (khớp [API contract](../web/src/lib/api/README.md)):

- Public: `GET /comments`, `POST /comments`, `GET /images`.
- Admin (`/admin/*`): xác thực **JWT Cognito** — verify chữ ký qua JWKS của User Pool,
  kiểm `iss`/`aud`/`exp`. Không cần authorizer của API Gateway (tiết kiệm).
- `POST /comments`: verify **CAPTCHA** (gọi API Turnstile/hCaptcha) → validate
  định dạng email → ghi DynamoDB → đăng ngay (không duyệt).
- Upload: `POST /admin/images/upload-url` sinh **presigned PUT** vào `uploads/`.
- CORS: cấu hình Function URL cho phép origin của Amplify (+ localhost khi dev).
- Bộ nhớ 256 MB, timeout 10s là đủ. **Kiến trúc arm64 (Graviton)** — rẻ hơn ~20% GB-s, Node chạy tốt.

### 3.3 Lambda `image-processor` (S3 ObjectCreated trên `uploads/`)
- Dùng `sharp` (qua Lambda Layer hoặc container image) chuyển sang **WebP**,
  resize giới hạn cạnh (vd ≤ 2000px), đọc `width/height`.
- Ghi WebP vào `public/`, cập nhật DynamoDB `status → active` + kích thước.
- Bộ nhớ 1024 MB, **arm64** (sharp hỗ trợ arm64), timeout 30s. Chỉ chạy khi upload → vài trăm lần tổng cộng, nằm gọn trong 400k GB-s free.

### 3.4 S3 (1 bucket, private)
- Prefix `uploads/` (ảnh gốc) và `public/` (WebP).
- **Block Public Access = ON**. CloudFront đọc qua **Origin Access Control (OAC)**.
- Lifecycle: có thể xoá ảnh gốc trong `uploads/` sau N ngày để tiết kiệm dung lượng.
- Giới hạn 5 MB/ảnh enforce ở bước sinh presigned (condition trong policy).

### 3.5 CloudFront
- Origin = S3 `public/` qua OAC. Cache dài (ảnh immutable, đặt tên theo id/hash).
- Always-free 1 TB + 10 triệu req → phục vụ ảnh ~$0; giảm cả phí GET của S3.

### 3.6 Cognito
- 1 User Pool, tạo sẵn tài khoản chủ shop (không cho self sign-up).
- Giữ pool ở tier **Essentials** (hoặc Lite) — đều có free 10.000 MAU vĩnh viễn.
  **Tránh tier Plus** (threat protection) vì **không có free tier**.
- Frontend đổi auth demo localStorage hiện tại sang Cognito (Amplify Auth hoặc
  Hosted UI). Token truyền vào tham số `token` của các hàm `lib/api/*`.

### 3.7 CAPTCHA
- **Cloudflare Turnstile** (free, không giới hạn) — khuyến nghị; hoặc hCaptcha.
- Site key ở frontend; secret key verify trong Lambda `api` trước khi ghi.

---

## 4. Bảng chi phí (lưu lượng nhỏ ~ vài nghìn lượt xem/tháng)

| Dịch vụ | Dùng | Free tier | Chi phí |
|---|---|---|---|
| CloudFront | < 1 GB ra | 1 TB + 10M req **vĩnh viễn** | **$0** |
| Lambda (api + img) | vài nghìn lượt | 1M req + 400k GB-s **vĩnh viễn** | **$0** |
| DynamoDB | < 1 GB, ít ops | 25 GB + 25/25 WCU/RCU **vĩnh viễn** | **$0** |
| Cognito | 1 MAU | 10.000 MAU | **$0** |
| S3 | ~1–2 GB | 5 GB + 20k GET + 2k PUT (12 tháng) | $0 → ~$0.05/tháng |
| Amplify Hosting (**SSR**) | thấp | 12 tháng: build/transfer + 500k req SSR + 100 GB-h | $0 → vài cent |
| Turnstile/hCaptcha | thấp | free | **$0** |
| **Tên miền** | — | không free | **~$10–15/năm** |
| Route 53 (nếu dùng) | 1 zone | — | $0.50/tháng → **né bằng DNS nhà đăng ký** |

→ **AWS định kỳ ≈ $0** trong free tier. Sau 12 tháng, S3 + Amplify chuyển sang trả
phí nhưng ở mức vài cent/tháng. Đặt **AWS Budget $1 và $5** + bật **Cost Anomaly
Detection** (free) làm lưới thứ hai.

> **Lưu ý Amplify SSR:** site dùng i18n middleware (`proxy.ts`) + route động theo
> locale → **chạy SSR, không static-export được**. Nên nó tiêu meter SSR của
> Amplify (500k request + 100 GB-h/tháng free 12 tháng), sau đó ~$0.30/1M req +
> $0.20/GB-h — vẫn chỉ vài cent ở lưu lượng nhỏ. Đừng kỳ vọng mô hình "static = free".

---

## 5. Bẫy cần tránh (đội phí)
- ❌ NAT Gateway (~$32/tháng) — đừng đặt Lambda trong VPC.
- ❌ API Gateway khi Function URL là đủ.
- ❌ Route 53 hosted zone nếu nhà đăng ký tên miền cho quản lý DNS.
- ❌ Provisioned concurrency / Lambda luôn-ấm — không cần cho site này.
- ❌ CloudWatch log giữ vô hạn — đặt retention **7–14 ngày** (free tier 5GB ingest/storage, 12 tháng).
- ❌ **Secrets Manager** ($0.40/secret/tháng) — dùng **SSM Parameter Store SecureString** (Standard free) cho CAPTCHA secret.
- ❌ Cognito tier **Plus** (không có free tier) — giữ Essentials/Lite.

---

## 6. IaC khuyến nghị
- **AWS CDK (TypeScript)** — đồng nhất ngôn ngữ với frontend, dễ chia sẻ type.
  Hoặc **AWS SAM** nếu muốn nhẹ, thuần serverless.
- Một stack: DynamoDB + 2 Lambda + S3 + CloudFront(OAC) + Cognito + Budget alarms.
- Tham số hoá: domain, CAPTCHA secret (để trong **SSM Parameter Store**/Secrets — Parameter Store standard free).

---

## 7. Việc tiếp theo cho backend
1. Dựng CDK stack khung (DynamoDB + 2 Lambda + S3 + CloudFront + Cognito).
2. Implement Lambda `api` theo [API contract](../web/src/lib/api/README.md).
3. Implement `image-processor` (sharp → WebP).
4. Nối frontend: thay auth admin demo bằng Cognito, gắn `NEXT_PUBLIC_API_URL`.
5. Bật AWS Budget $1/$5, CloudWatch retention 7–14 ngày.
