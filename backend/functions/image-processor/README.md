# Lambda: image-processor

Chuyển ảnh gốc khách upload thành **WebP** (resize + xoay theo EXIF), lưu vào
prefix `public/`, rồi cập nhật bản ghi DynamoDB sang `status: "active"` kèm
`url / width / height / sizeBytes`.

> **Ai làm gì:** Code handler + deps ở đây do FE viết. **Teammate backend** lo
> trigger, IAM, đóng gói `sharp`, env vars và deploy (các mục ⬇️ đánh dấu **[BE]**).

---

## 1. Luồng hoạt động
```
admin upload ─presigned PUT─▶ S3  uploads/{imageId}        (metadata: image-id, created-at)
                                   │ ObjectCreated event
                                   ▼
                          Lambda image-processor
                            ├─ sharp → WebP (≤2000px)
                            ├─ PUT  → S3 public/{imageId}.webp
                            └─ UpdateItem DynamoDB: status=active, url, w, h, sizeBytes
```
Bản ghi DynamoDB được **API Lambda tạo trước** (lúc `POST /admin/images`) với
`status: "processing"`. Function này chỉ **update**, không tạo mới.

---

## 2. Trigger **[BE]**
- Nguồn: **S3 ObjectCreated** (Put), **chỉ** prefix `uploads/`.
- Cấu hình filter prefix `uploads/` để không tự kích hoạt khi ghi vào `public/`
  (tránh vòng lặp vô hạn). Handler cũng tự bỏ qua key ngoài `uploads/` cho chắc.

## 3. Biến môi trường **[BE]**
| Env | Bắt buộc | Mặc định | Ý nghĩa |
|---|---|---|---|
| `TABLE_NAME` | ✅ | — | Tên bảng DynamoDB |
| `BUCKET` | ✅ | — | Bucket S3 (chứa cả `uploads/` và `public/`) |
| `CDN_BASE_URL` | ✅ | — | Base CloudFront, không slash cuối, vd `https://dxxxx.cloudfront.net` |
| `UPLOADS_PREFIX` | | `uploads/` | |
| `PUBLIC_PREFIX` | | `public/` | |
| `MAX_EDGE` | | `2000` | Cạnh dài nhất (px) |
| `WEBP_QUALITY` | | `82` | Chất lượng WebP 1–100 |

Thiếu env bắt buộc → function throw ngay khi khởi tạo (thấy rõ trong CloudWatch).

## 4. IAM role tối thiểu **[BE]**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::<BUCKET>/uploads/*" },
    { "Effect": "Allow", "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::<BUCKET>/public/*" },
    { "Effect": "Allow", "Action": ["dynamodb:UpdateItem"],
      "Resource": "arn:aws:dynamodb:<region>:<acct>:table/<TABLE_NAME>" }
  ]
}
```
(+ quyền ghi CloudWatch Logs mặc định của Lambda.)

## 5. ⚠️ Hợp đồng tích hợp — PHẢI khớp, lệch là không chạy

**a) Metadata trên object upload** (do **presigned PUT của API Lambda** đính kèm):
- `x-amz-meta-image-id` → id ảnh
- `x-amz-meta-created-at` → `createdAt` (ISO 8601) của bản ghi DynamoDB

Handler dùng 2 cái này để tìm đúng row DynamoDB. Nếu API Lambda không set được
metadata, xem cách khác ở mục 7.

**b) Khóa DynamoDB**: hàm `buildItemKey()` trong [index.ts](./index.ts) đang theo
single-table của [ARCHITECTURE.md](../../ARCHITECTURE.md) §3.1:
`PK="IMAGE"`, `SK="<createdAt>#<id>"`. **Nếu bảng dùng khóa khác → sửa đúng 1 hàm này.**

**c) Shape item**: function set `status, url, width, height, sizeBytes` — khớp
`AdminImage` trong [`web/src/lib/api/types.ts`](../../../web/src/lib/api/types.ts).
`sizeBytes` đang lưu **kích thước ảnh gốc** (đổi sang `data.length` nếu muốn lưu cỡ WebP).

## 6. ⚠️ Đóng gói `sharp` (native binary) — gotcha quan trọng **[BE]**

`sharp` có **binary biên dịch theo OS/CPU**. Lambda chạy **Amazon Linux**, kiến
trúc ta chọn là **arm64** → KHÔNG được zip thẳng `node_modules/sharp` build trên
máy Mac/Windows, sẽ lỗi `Could not load the "sharp" module ... linux-arm64`.

Chọn 1 trong 2:
- **Cài đúng platform** trước khi đóng gói:
  ```bash
  npm install --os=linux --cpu=arm64 sharp
  ```
  rồi zip kèm `node_modules`.
- **Hoặc** dùng **Lambda Layer cho sharp arm64** (vd layer dựng sẵn / tự build qua
  Docker `public.ecr.aws/lambda/nodejs:20-arm64`) và mark `sharp` external khi bundle.

## 7. Build & deploy gợi ý **[BE]**
- **Runtime**: Node.js 20, **architecture arm64**, **memory 1024 MB**, **timeout 30s**
  (khớp ARCHITECTURE.md §3.3).
- Handler: `index.handler`.
- Cách A — esbuild bundle (nhẹ):
  ```bash
  npx esbuild index.ts --bundle --platform=node --format=esm \
    --target=node20 --outfile=dist/index.mjs --external:sharp
  # sharp cung cấp qua Layer arm64 (mục 6)
  ```
- Cách B — zip node_modules: `npm ci --omit=dev` (đã cài sharp arm64 ở mục 6) → zip.
- **aws-sdk v3 clients** có sẵn trong runtime Node 20; `@aws-sdk/lib-dynamodb` thì
  **không chắc có** → cách A bundle nó vào, cách B đã nằm trong `dependencies`.

> Nếu API Lambda **không set được metadata** (mục 5a): thay vì đọc metadata, tạo
> **GSI theo `imageId`** và query để lấy khóa, hoặc đặt object key chứa luôn
> `createdAt` (vd `uploads/{createdAt}__{imageId}`) rồi parse trong handler.

## 8. Test nhanh
- Upload 1 file vào `s3://<BUCKET>/uploads/<id>` kèm metadata `image-id`,
  `created-at`, rồi xem CloudWatch log + kiểm tra `public/<id>.webp` và row DynamoDB.
