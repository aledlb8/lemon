Lemon is an invite-only ShareX uploader with private galleries. It runs on
Next.js, MongoDB (Mongoose), and Vercel Blob storage.

## Getting Started

Install dependencies, then run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment

Create a `.env.local` with:

```bash
MONGODB_URI="mongodb+srv://..."
BLOB_READ_WRITE_TOKEN="vercel_blob_token"
```

## Admin access

Set the first admin manually in MongoDB by changing the `role` field:

- `role: 1` = admin
- `role: 0` = normal user
- `role: -1` = banned

Admins can generate invite codes from `/admin/invites`.

## ShareX setup

- Upload URL: `https://your-domain.com/api/upload`
- Header name: `X-Upload-Key`
- Header value: your upload key from the dashboard

Uploads inherit the user’s default visibility setting.

## Notes

- Max upload size is 4.5MB.
- Private files are served through `/api/media/:id/download`.
- Vercel Blob objects are public by design; Lemon keeps private uploads unlisted
  and only serves them through authenticated routes.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
