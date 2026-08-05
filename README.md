# telvo

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.


## Cloudinary configuration for CI

This project uses Cloudinary for all client image uploads (profile photos, job photos, chat images, portfolio images). The Android CI build (and many upload flows) require a Cloudinary unsigned upload preset and the Cloudinary cloud name to be available during CI.

What to provide to GitHub Actions

- CLOUDINARY_CLOUD_NAME — your Cloudinary cloud name (e.g. `demo`).
- CLOUDINARY_UPLOAD_PRESET — an *unsigned* upload preset name that allows client-side (unsigned) uploads.

Add these as **Repository secrets** in GitHub: Settings → Secrets and variables → Actions → New repository secret.

Why this matters

The CI currently copies `.env.example` to `.env` during the build. `.env.example` contains placeholder values (e.g. `your_cloudinary_upload_preset`) which are not valid. If the required values are not supplied via GitHub Secrets a pre-build check will fail early with an actionable error telling you which secrets to add. This avoids wasting CI minutes while the build fails during uploads.

How to create an unsigned upload preset in Cloudinary

1. Sign in to your Cloudinary dashboard and select your account.
2. Go to Settings → Upload.
3. Scroll to the "Upload presets" section and click "Add upload preset" (or "Create unsigned preset").
4. Give it a name (for example `telvo_unsigned`).
5. Set "Signing mode" to "Unsigned" (this allows uploads from the client without an API secret).
6. Configure any folder or transformation defaults you want (optional).
7. Save the preset and note the preset name — this is the value for CLOUDINARY_UPLOAD_PRESET.

Notes on security

- Unsigned presets allow direct client uploads. Limit the allowed folders and transformations in the preset settings and use Firestore security rules to restrict which users can reference uploaded images.
- Do not commit API secrets (CLOUDINARY_API_SECRET) into the repository. If server-side signed uploads are needed later, store API credentials in Actions secrets and implement a server-side signing endpoint.

Local development

To run locally, create a `.env` file at the project root (copy `.env.example` to `.env`) and set the following two values:

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset_name

Alternatively, set these environment variables in your local shell. Make sure the values are not the placeholder `your_...` values in `.env.example`.

Troubleshooting uploads

- If uploads fail in CI, check the Action logs — the new pre-build step will report missing Cloudinary secrets and stop the build early.
- If uploads fail at runtime in the app, check the device logs and ensure the app loads the `.env` values or the environment is configured correctly.

If you need help adding the GitHub Secrets or creating the preset in Cloudinary, tell me which repository/org you'd like instructions for and I can provide a step-by-step guide.
