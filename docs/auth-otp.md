# Mobile number + OTP login (planned)

Status: **the app is ready; the backend isn't built yet.** The login screen shows only email + password until this is switched on.

## What's already in the app

| Piece | Where |
| --- | --- |
| Feature flag | `features.phoneOtpLogin` in `src/lib/config.ts`, on when `EXPO_PUBLIC_ENABLE_PHONE_OTP=1` |
| Login screen method switch ("Mobile OTP" / "Email") | `src/app/(auth)/login.tsx`, `src/features/auth/login-methods.ts` |
| Phone → code → verify form, resend countdown, SMS autofill (`oneTimeCode`, `sms-otp`) | `src/features/auth/components/phone-otp-form.tsx` |
| Indian number normalisation to E.164 (`+91XXXXXXXXXX`) | `src/features/auth/phone.ts` (tested) |
| API calls | `authApi.requestOtp`, `authApi.verifyOtp` in `src/features/auth/api.ts` |
| Session handling | Both login methods end in the same `AuthSession` → `useAuth().signIn()`, so tokens, `/auth/me`, permissions and refresh work unchanged |

To turn it on once the backend exists: set `EXPO_PUBLIC_ENABLE_PHONE_OTP=1` in `.env`, then test it. When it's ready for everyone, flip the default in `config.ts`.

## Backend contract (web repo, `backend/src/modules/auth`)

Both endpoints are public (no bearer token), go under the existing `authRateLimiter`, and use the existing response envelope.

### `POST /api/v1/auth/otp/request`

Request:

```json
{ "phone": "+919876543210" }
```

Response `200`:

```json
{ "success": true, "data": { "challengeId": "uuid", "resendAfter": 30, "expiresIn": 300 } }
```

- Always return `200` with a challenge, even when no user has that number, so the endpoint can't be used to discover who is registered. Only send the SMS when a matching **active** user exists.
- Generate a 6-digit code with a CSPRNG and store only its hash (like `PasswordResetToken`).
- Limits: one code per number every 30 s; at most 5 codes per number per hour; codes expire after 5 minutes.

### `POST /api/v1/auth/otp/verify`

Request:

```json
{ "challengeId": "uuid", "phone": "+919876543210", "code": "123456" }
```

Response `200`: **exactly the same shape as `POST /auth/login`**:

```json
{
  "success": true,
  "data": {
    "accessToken": "…",
    "refreshToken": "…",
    "user": { "id": "…", "name": "…", "email": "…", "role": "WORKER", "permissions": ["EGG:CREATE", "…"] }
  }
}
```

- Errors: `400` "Invalid or expired code" (the same message for a wrong code, an expired code or an unknown challenge); `429` once there have been 5 wrong attempts on a challenge, which also invalidates it.
- On success: mark the challenge used, set `lastLoginAt`, write an `AuthAuditLog` `LOGIN` row with `method: "otp"`, and issue tokens through the existing `issueTokenPair`.

## Schema changes

```prisma
model User {
  // existing field; make it unique and always E.164 (+91…)
  phone String? @unique
  phoneVerifiedAt DateTime?
}

model OtpChallenge {
  id         String    @id @default(uuid())
  phone      String
  codeHash   String
  userId     String?   // null when no user has this number (no SMS sent)
  attempts   Int       @default(0)
  expiresAt  DateTime
  usedAt     DateTime?
  createdAt  DateTime  @default(now())

  @@index([phone, createdAt])
  @@map("otp_challenges")
}
```

Migration note: existing `users.phone` values are free text (e.g. `+91-9876543210` in the seed). Normalise them to E.164 and resolve duplicates before adding the unique index.

## Decisions still open

- **SMS provider:** MSG91 (Indian DLT templates, about ₹0.15–0.25 per SMS) or Firebase Phone Auth. MSG91 keeps tokens and RBAC in our own backend; Firebase would need a token exchange step.
- **DLT registration:** Indian rules require a registered sender ID and message template before transactional SMS can be sent. This takes a few days, so start it early.
- **Who gets OTP:** every user, or workers only (with email + password kept for owners and admins)?
- **Phone-only users:** workers with no email. `User.email` is currently required and unique, so either make it optional or generate a placeholder.
