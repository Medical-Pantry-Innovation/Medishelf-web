import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="page">
      {/* Navigation */}
      <header className="header">
        <div>
          <Image
            src="/images/medishelf_logo.png"
            alt="MediShelf Logo"
            width={140}
            height={70}
            priority
            className="logo"
          />
        </div>

        <nav className="nav">
          <Link href="#benefits" className="navLink">
            Benefits
          </Link>
          <Link href="#contact" className="navLink">
            Contact us
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero">
        <h1 className="title">
          Every image.
          <br />
          Improves healthcare.
          <br />
          
        </h1>

        <div className="content">
          <div className="left">
            <p className="description">
              MediShelf is a collaborative project between Medical Pantry and
              the Healthcare Carbon Lab (The University of Melbourne).
            </p>

            <Link href="/login">
              <button className="button">Get started</button>
            </Link>
          </div>

          <div className="imageContainer">
            <Image
              src="/images/medishelf_homepage_img1.png"
              alt="Medical Shelf"
              width={850}
              height={600}
              className="heroImage"
            />
          </div>
        </div>

        <div className="supportedWrap">
          <p className="supported">Supported by:</p>
        </div>
      </section>

      {/* Footer Logos */}
      <footer className="footer">
        <Image
          src="/images/medical_pantry_logo.png"
          alt="Medical Pantry"
          width={190}
          height={110}
        />
        <Image
          src="/images/unimelb_logo.png"
          alt="University of Melbourne"
          width={100}
          height={100}
        />
      </footer>

      {/* Benefits Section */}
      <section id="benefits" className="benefits">
        <p className="sectionLabel">Benefits</p>

        <h2 className="sectionTitle">
          We're going to crack the medical packaging code.
        </h2>

        <p className="sectionDescription">
          Every day millions of medical products are purchased globally.
          <br />
          What if there was a way to learn more about what is being stocked
          on your shelf and put them all into one place.
          <br />
          If we can do this we can fundamentally transform how we understand
          medical device labelling and recovery.
        </p>

        <hr className="divider" />

        <Image
          src="/images/medishelf_homepage_img2.png"
          alt="Medical products"
          width={1125}
          height={633}
          className="benefitImage"
        />

        <hr className="divider" />

        <h2 className="sectionTitle">See the big picture</h2>

        <p className="sectionDescription">
          MediShelf enables you to be a MediMate, allowing you to understand
          what products you commonly see on your shelf.
        </p>

        <hr className="divider" />

        {/* Steps */}
        <div className="steps">
          <div className="step">
            <h3 className="stepNumber">01</h3>
            <p className="stepText">Take a photo on your phone.</p>
          </div>

          <div className="step">
            <h3 className="stepNumber">02</h3>
            <p className="stepText">
              MediShelf automatically extracts key information.
            </p>
          </div>

          <div className="step">
            <h3 className="stepNumber">03</h3>
            <p className="stepText">
              Build a shared medical device inventory library.
            </p>
          </div>
        </div>

        <hr className="divider" />

        {/* Contact CTA */}
        <section id="contact" className="contact">
          <h2 className="contactTitle">Become a MediMate</h2>

          <p className="sectionDescription">
            Help us transform medical device data into data for resource
            recovery.
            <br />
            Your passion can make a real difference today.
            <br />
            Have a question or wondering how to get involved? Get in touch
            with us.
          </p>

          <a href="mailto:julie@medicalpantry.org" className="email">
            julie@medicalpantry.org
          </a>
        </section>

        <hr className="divider" />

        {/* Team */}
        <div className="team">
          <p className="teamTitle">Team</p>
          <p>Dr Julie Dao</p>
          <p>WingYee He</p>
          <p>James Baikie</p>
          <p>Nikheisha</p>
          <p>Annika</p>
        </div>
      </section>

      <style>{`
        .page {
          max-width: 1280px;
          margin: 0 auto;
          padding: 30px 70px;
          font-family: Arial, sans-serif;
          background: #fff;
          min-height: 100vh;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }

        .logo {
          width: 120px;
          height: auto;
        }
        .nav {
          display: flex;
          gap: 40px;
        }

        .navLink {
          color: #666;
          text-decoration: none;
          font-weight: 600;
          font-size: 18px;
          font-size: clamp(13px, 3vw, 18px);
        }

        .title {
          font-size: 66px;
          font-weight: 500;
          line-height: 1;
          text-align: center;
          margin-bottom: 50px;
          color: #000;
        }

        .content {
          display: flex;
          gap: 40px;
          align-items: flex-end;
        }

        .left {
          width: 270px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .description {
          font-size: 22px;
          line-height: 1.5;
          color: #111;
        }

        .button {
          margin-top: 30px;
          width: 100%;
          background: #151a67;
          color: #fff;
          border: none;
          border-radius: 40px;
          padding: 18px;
          font-size: 32px;
          font-weight: bold;
          cursor: pointer;
        }

        .supportedWrap {
          margin-top: 80px;
        }

        .supported {
          font-size: 22px;
          color: #666;
        }

        .imageContainer {
          flex: 1;
        }

        .heroImage {
          width: 100%;
          height: auto;
          border-radius: 35px;
          object-fit: cover;
        }

        .footer {
          margin-top: 60px;
          padding-top: 30px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 120px;
        }

        .benefits {
          margin-top: 100px;
          padding-top: 60px;
          border-top: 1px solid #ddd;
        }

        .sectionLabel {
          font-size: 18px;
          color: #777;
          margin-bottom: 40px;
        }

        .sectionTitle {
          font-size: 48px;
          font-weight: 400;
          line-height: 1.2;
          color: #000;
          margin-bottom: 30px;
        }

        .sectionDescription {
          font-size: 18px;
          line-height: 1.6;
          color: #777;
        }

        .divider {
          border: none;
          border-top: 1px solid #ddd;
          margin: 60px 0;
        }

        .benefitImage {
          width: 100%;
          height: auto;
          border-radius: 35px;
          object-fit: cover;
        }

        .steps {
          display: flex;
          justify-content: space-between;
          gap: 50px;
        }

        .stepNumber {
          font-size: 72px;
          font-weight: 300;
          color: #777;
          margin-bottom: 30px;
        }

        .stepText {
          font-size: 18px;
          color: #666;
          max-width: 250px;
          line-height: 1.5;
        }

        .contact {
          text-align: center;
          padding: 50px 0;
        }

        .contactTitle {
          font-size: 48px;
          font-weight: 400;
          margin-bottom: 30px;
        }

        .email {
          display: inline-block;
          font-size: 18px;
          color: #151a67;
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid #151a67;
          padding-bottom: 3px;
        }

        .team {
          color: #777;
          font-size: 16px;
          line-height: 1.5;
        }

        .teamTitle {
          font-weight: bold;
          margin-bottom: 5px;
        }

        /* ---------- MOBILE ---------- */
        @media (max-width: 768px) {
          .page {
            padding: 20px 24px;
          }

          .title {
            font-size: 56px;
            margin-bottom: 30px;
          }

          .content {
            flex-direction: column-reverse;
            align-items: center;
            gap: 24px;
          }

          .left {
            width: 100%;
            align-items: center;
            text-align: center;
          }

          .description {
            font-size: 16px;
          }

          .button {
            width: auto;
            padding: 14px 40px;
            font-size: 18px;
            border-radius: 30px;
          }

          .supportedWrap {
            margin-top: 40px;
            text-align: center;
          }

          .footer {
            gap: 40px;
            flex-wrap: wrap;
          }

          .benefits {
            margin-top: 60px;
            padding-top: 40px;
          }

          .sectionLabel,
          .sectionTitle,
          .sectionDescription {
            text-align: center;
          }

          .sectionTitle {
            font-size: 32px;
          }

          .divider {
            margin: 40px 0;
          }

          .steps {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 40px;
          }

          .stepText {
            max-width: none;
          }

          .contactTitle {
            font-size: 32px;
          }

          .team {
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}