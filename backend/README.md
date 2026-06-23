# Backend (AWS)

Phần này do teammate phụ trách AWS dựng.

```
functions/   Lambda — CAPTCHA verify, xử lý ảnh → WebP, comments API
infra/       Infrastructure-as-Code (CDK / SAM / Terraform)
```

## Dịch vụ AWS

| Dịch vụ | Vai trò |
|---|---|
| Cognito | Auth cho chủ shop |
| S3 (private) | Lưu ảnh gốc + WebP |
| CloudFront | CDN phân phối ảnh |
| Lambda | API, CAPTCHA check, xử lý ảnh |
| DynamoDB | Bình luận + phản hồi |
| API Gateway / Lambda URL | Endpoint cho frontend |

## API contract

Frontend gọi backend qua helpers trong `web/src/lib/api/`. Thống nhất shape
request/response ở đó trước khi implement hai bên.
