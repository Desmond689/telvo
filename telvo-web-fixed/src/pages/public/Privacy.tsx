import { LegalPage } from './LegalPage';

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="July 2026">
      <h2>Information We Collect</h2>
      <p>We collect information you provide directly (name, phone number, email, location) and information generated through your use of TELVO (jobs, messages, reviews).</p>
      <h2>How We Use Your Information</h2>
      <p>We use your information to operate the marketplace, connect you with relevant professionals or customers, process payments, and improve our services.</p>
      <h2>Sharing</h2>
      <p>We share limited profile information (name, rating, verification status) publicly as part of the marketplace experience. Verification documents (ID, selfie) are private and only accessible to our verification team.</p>
      <h2>Data Security</h2>
      <p>Data is stored using Firebase infrastructure with role-based access control enforced at the database layer, not just in the app.</p>
      <h2>Your Rights</h2>
      <p>You may request access to, correction of, or deletion of your personal data by contacting support@telvo.com.</p>
    </LegalPage>
  );
}
