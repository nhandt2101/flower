# Flower Shop Website

Website giới thiệu cửa hàng hoa tại Đức. Ba ngôn ngữ: Đức (DE), Anh (EN), Việt (VI).

## Cấu trúc repo

```
assets/         Wireframes và tài nguyên thiết kế
deliverables/   Tài liệu gửi khách hàng
docs/           Spec và tài liệu nội bộ (không commit)
tools/          Script hỗ trợ
web/            Next.js app
```

## Phát triển

```bash
cd web
npm install
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) — tự redirect sang `/de`.

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **i18n**: next-intl, path-based (`/de`, `/en`, `/vi`)
- **Hosting**: AWS Amplify
- **Auth (admin)**: AWS Cognito
- **Storage**: AWS S3 + CloudFront
- **Database**: AWS DynamoDB
- **API**: AWS Lambda

## Trang

| Route | Mô tả | Trạng thái |
|---|---|---|
| `/[locale]` | Trang chủ | Đang làm |
| `/[locale]/gallery` | Thư viện ảnh | Chờ |
| `/[locale]/comments` | Bình luận | Chờ |
| `/[locale]/contact` | Liên hệ | Chờ |
| `/admin/login` | Đăng nhập admin | Chờ |
| `/admin/images` | Quản lý ảnh | Chờ |
| `/admin/comments` | Quản lý bình luận | Chờ |
