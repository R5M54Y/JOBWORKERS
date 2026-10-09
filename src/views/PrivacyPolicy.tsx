// CAREERHUB Privacy Policy Page

import { Layout } from './Layout';

interface PrivacyPolicyViewProps {
  user?: any;
  branding?: any;
}

export const PrivacyPolicyView = ({ user, branding }: PrivacyPolicyViewProps) => {
  return Layout({
    title: 'Privacy Policy',
    user,
    branding,
    children: (
      <div class="container py-5">
        <div class="card shadow-sm">
          <div class="card-body p-5">
            <h1 class="mb-4">Privacy Policy</h1>
            <p class="text-muted mb-4">Last updated: October 9, 2026</p>

            <section class="mb-4">
              <h2 class="h4 mb-3">Introduction</h2>
              <p>Welcome to our job aggregation platform. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.</p>
            </section>

            <section class="mb-4">
              <h2 class="h4 mb-3">Information We Collect</h2>
              <h3 class="h5 mb-2">Account Information</h3>
              <ul>
                <li>Email address</li>
                <li>Password (encrypted)</li>
                <li>Account creation date</li>
              </ul>
              
              <h3 class="h5 mb-2 mt-3">Usage Information</h3>
              <ul>
                <li>Job search queries</li>
                <li>Saved jobs and searches</li>
                <li>Application tracking data</li>
                <li>Job alerts preferences</li>
              </ul>

              <h3 class="h5 mb-2 mt-3">Automatically Collected Information</h3>
              <ul>
                <li>Browser type and version</li>
                <li>IP address</li>
                <li>Access times and dates</li>
                <li>Pages viewed</li>
              </ul>
            </section>

            <section class="mb-4">
              <h2 class="h4 mb-3">How We Use Your Information</h2>
              <ul>
                <li>To provide and maintain our service</li>
                <li>To manage your account and authentication</li>
                <li>To save your job preferences and searches</li>
                <li>To send job alerts based on your saved searches</li>
                <li>To track your job applications</li>
                <li>To improve our service and user experience</li>
                <li>To communicate with you about service updates</li>
              </ul>
            </section>

            <section class="mb-4">
              <h2 class="h4 mb-3">Data Storage and Security</h2>
              <p>Your data is stored securely using Cloudflare's infrastructure:</p>
              <ul>
                <li>Passwords are hashed using industry-standard encryption</li>
                <li>Data is stored in Cloudflare D1 databases with enterprise-grade security</li>
                <li>Session tokens are secured and expire after 30 days</li>
                <li>HTTPS encryption protects data in transit</li>
              </ul>
            </section>

            <section class="mb-4">
              <h2 class="h4 mb-3">Third-Party Job Sources</h2>
              <p>We aggregate job listings from multiple sources including:</p>
              <ul>
                <li>RemoteOK</li>
                <li>Remotive</li>
                <li>Jobicy</li>
                <li>Ashby</li>
                <li>Lever</li>
              </ul>
              <p>When you click on a job listing, you may be redirected to the original job posting on third-party websites. These third parties have their own privacy policies governing the collection and use of your information.</p>
            </section>

            <section class="mb-4">
              <h2 class="h4 mb-3">Cookies and Tracking</h2>
              <p>We use cookies and similar tracking technologies to:</p>
              <ul>
                <li>Maintain your login session</li>
                <li>Remember your preferences</li>
                <li>Analyze site usage and traffic</li>
              </ul>
              <p>We use third-party analytics services (Histats) to understand how users interact with our service.</p>
            </section>

            <section class="mb-4">
              <h2 class="h4 mb-3">Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Export your data</li>
                <li>Opt out of job alerts</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            <section class="mb-4">
              <h2 class="h4 mb-3">Data Retention</h2>
              <p>We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account at any time through your account settings.</p>
            </section>

            <section class="mb-4">
              <h2 class="h4 mb-3">Children's Privacy</h2>
              <p>Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18.</p>
            </section>

            <section class="mb-4">
              <h2 class="h4 mb-3">Changes to This Privacy Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last updated" date at the top of this policy.</p>
            </section>

            <section class="mb-4">
              <h2 class="h4 mb-3">Contact Us</h2>
              <p>If you have questions about this Privacy Policy or our data practices, please contact us through our support channels.</p>
            </section>

            <div class="mt-5 pt-4 border-top">
              <a href="/" class="btn btn-primary">
                <i class="bi bi-arrow-left me-2"></i>Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    ),
  });
};
