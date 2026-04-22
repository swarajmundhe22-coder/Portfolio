import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleDot, AtSign, Database, Activity, Globe, Shield } from 'lucide-react';
import './PrivacyPolicyPage.css';

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="privacy-policy" className="privacy-page-wrapper">
      <div className="privacy-inner">
        <header className="privacy-top-bar">
          <button 
            className="privacy-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </button>
        </header>

        <div className="privacy-main-content">
          <div className="privacy-cards-container">
            
            <div className="privacy-card-row">
              <div className="privacy-icon-container">
                <Database size={24} className="privacy-icon" strokeWidth={1.5} />
              </div>
              <div className="privacy-card-content">
                <h2 className="privacy-card-title">Data Collection</h2>
                <p className="privacy-card-desc">
                  I collect minimal personal information, such as your name and email address, only when you voluntarily provide it through contact forms or by subscribing to updates. Usage data is collected automatically to improve the portfolio experience.
                </p>
              </div>
            </div>

            <div className="privacy-card-row">
              <div className="privacy-icon-container">
                <Activity size={24} className="privacy-icon" strokeWidth={1.5} />
              </div>
              <div className="privacy-card-content">
                <h2 className="privacy-card-title">Data Usage</h2>
                <p className="privacy-card-desc">
                  Collected information is used exclusively to respond to your inquiries, provide relevant updates, and improve the performance of this website. Your information is never sold to third parties.
                </p>
              </div>
            </div>

            <div className="privacy-card-row">
              <div className="privacy-icon-container">
                <Globe size={24} className="privacy-icon" strokeWidth={1.5} />
              </div>
              <div className="privacy-card-content">
                <h2 className="privacy-card-title">Cookies & Tracking</h2>
                <p className="privacy-card-desc">
                  I use essential cookies to ensure the basic functionality of the website and standard anonymous analytics cookies to understand how visitors interact with the pages. You can disable non-essential tracking via your browser settings.
                </p>
              </div>
            </div>

            <div className="privacy-card-row">
              <div className="privacy-icon-container">
                <Shield size={24} className="privacy-icon" strokeWidth={1.5} />
              </div>
              <div className="privacy-card-content">
                <h2 className="privacy-card-title">User Rights</h2>
                <p className="privacy-card-desc">
                  You have the right to request access to, modification of, or deletion of any personal data you have provided to me. Simply reach out via the contact information below to exercise these rights at any time.
                </p>
              </div>
            </div>

            <div className="privacy-card-row">
              <div className="privacy-icon-container">
                <CircleDot size={24} className="privacy-icon" strokeWidth={1.5} />
              </div>
              <div className="privacy-card-content">
                <h2 className="privacy-card-title">Data Retention</h2>
                <p className="privacy-card-desc">
                  Guestbook messages are retained indefinitely unless you delete them or request account deletion. Analytics data is aggregated and retained for up to 12 months.
                </p>
              </div>
            </div>

            <div className="privacy-card-row">
              <div className="privacy-icon-container">
                <AtSign size={24} className="privacy-icon" strokeWidth={1.5} />
              </div>
              <div className="privacy-card-content">
                <h2 className="privacy-card-title">Contact for Privacy</h2>
                <p className="privacy-card-desc">
                  For any privacy-related inquiries, requests, or complaints, contact: <a href="mailto:swarajmundhe22@gmail.com">swarajmundhe22@gmail.com</a>. I aim to respond to all privacy requests within 30 days.
                </p>
              </div>
            </div>

          </div>

          <div className="privacy-divider" />

          <div className="privacy-footer-row">
            <div className="privacy-foot-col privacy-foot-left">
              <p>Have questions about this policy?</p>
            </div>
            <div className="privacy-foot-col privacy-foot-center">
              <a href="mailto:swarajmundhe22@gmail.com">swarajmundhe22@gmail.com</a>
            </div>
            <div className="privacy-foot-col privacy-foot-right">
              <p className="privacy-foot-label">LAST UPDATED</p>
              <p className="privacy-foot-val">January 1, 2026</p>
            </div>
          </div>

          <div className="privacy-divider footer-end-div" />

          <div className="privacy-brand-row">
            <h4>let's create</h4>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivacyPolicyPage;
