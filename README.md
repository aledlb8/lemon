# Lemon

Invite-only ShareX uploader with private galleries. Built with Next.js, MongoDB (Mongoose), and Vercel Blob.

## Quick start

```bash
bun install
bun dev
```

## Environment

Create `.env`:

```bash
MONGODB_URI="mongodb+srv://..."
BLOB_READ_WRITE_TOKEN="vercel_blob_token"
APP_ORIGIN="https://your-domain.com"
```

`APP_ORIGIN` is optional but recommended to avoid trusting the Host header.

## Admin

Set the first admin in MongoDB by updating `role`:

- `role: 1` = admin
- `role: 0` = user
- `role: -1` = banned

## ShareX

- Upload URL: `https://your-domain.com/api/upload`
- Header name: `X-Upload-Key`
- Header value: your upload key from the dashboard

Uploads inherit the user’s default visibility.

## Notes

- Max upload size: 4.5MB.