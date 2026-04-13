/**
 * @file ImprintModal.tsx
 * @description
 * This component renders the Imprint information in a stylized modal window.
 */
import * as React from 'react';
import { useTranslation } from '../lib/i18n';

interface ImprintModalProps {
    onClose: () => void;
}

export const ImprintModal: React.FC<ImprintModalProps> = ({ onClose }) => {
    const { lang } = useTranslation();

    // Effect to handle the 'Escape' key for closing the modal
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const renderGermanContent = () => (
        <>
            <h1>Datenschutzerklärung</h1>

            <h2>1. Datenschutz auf einen Blick</h2>
            <h3>Allgemeine Hinweise</h3>
            <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.</p>

            <h3>Datenerfassung auf dieser Website</h3>
            <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong>
            <p>Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle" in dieser Datenschutzerklärung entnehmen.</p>

            <strong>Wie erfassen wir Ihre Daten?</strong>
            <p>Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben.</p>
            <p>Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.</p>

            <strong>Wofür nutzen wir Ihre Daten?</strong>
            <p>Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden. Sofern über die Website Verträge geschlossen oder angebahnt werden können, werden die übermittelten Daten auch für Vertragsangebote, Bestellungen oder sonstige Auftragsanfragen verarbeitet.</p>

            <strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong>
            <p>Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.</p>

            <h2>2. Hosting</h2>
            <p>Wir hosten die Inhalte unserer Website bei folgendem Anbieter:</p>
            <h3>Externes Hosting</h3>
            <p>Diese Website wird extern gehostet. Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es sich v. a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und sonstige Daten, die über eine Website generiert werden, handeln.</p>
            <p>Das externe Hosting erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).</p>
            <p>Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt die Verarbeitung ausschließlich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG. Die Einwilligung ist jederzeit widerrufbar.</p>
            <p><strong>Eingesetzter Hoster:</strong><br />
                manitu GmbH<br />
                Welvertstraße 2<br />
                66606 St. Wendel</p>

            <h2>3. Allgemeine Hinweise und Pflichtinformationen</h2>
            <h3>Datenschutz</h3>
            <p>Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>
            <p>Hinweis zur verantwortlichen Stelle:</p>
            <p>
                <strong>Kay Engelhardt</strong><br />
                c/o Nordbahnstudios<br />
                Wollankstr 101<br />
                13187 Berlin<br />
                E-Mail: hello@heistology.com
            </p>

            <h3>Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie gegen Direktwerbung (Art. 21 DSGVO)</h3>
            <p>WENN DIE DATENVERARBEITUNG AUF GRUNDLAGE VON ART. 6 ABS. 1 LIT. E ODER F DSGVO ERFOLGT, HABEN SIE JEDERZEIT DAS RECHT, AUS GRÜNDEN, DIE SICH AUS IHRER BESONDEREN SITUATION ERGEBEN, GEGEN DIE VERARBEITUNG IHRER PERSONENBEZOGENEN DATEN WIDERSPRUCH EINZULEGEN...</p>

            <h2>4. Datenerfassung auf dieser Website</h2>
            <h3>Kontaktformular / Anfrage per E-Mail</h3>
            <p>Wenn Sie uns per Kontaktformular oder E-Mail Anfragen zukommen lassen, werden Ihre Angaben inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage bei uns gespeichert. Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt, oder auf Grundlage unseres berechtigten Interesses (Art. 6 Abs. 1 lit. f DSGVO).</p>

            <h2>5. Analyse-Tools und Tools von Drittanbietern</h2>

            <h3>GoatCounter</h3>
            <p>Wir nutzen GoatCounter zur Analyse der Website-Zugriffe. GoatCounter ist ein datenschutzfreundlicher Analysedienst, der <strong>keine Cookies</strong> setzt und keine personenbezogenen Daten speichert. Die Analyse erfolgt rein auf Basis aggregierter Daten. Weitere Informationen finden Sie unter: <a href="https://www.goatcounter.com/privacy" target="_blank" rel="noopener noreferrer">https://www.goatcounter.com/privacy</a>.</p>

            <h3>Google Analytics</h3>
            <p>Diese Website nutzt Funktionen des Webanalysedienstes Google Analytics. Anbieter ist die Google Ireland Limited („Google"), Gordon House, Barrow Street, Dublin 4, Irland.</p>
            <p>Google Analytics verwendet sog. <strong>"Cookies"</strong>. Das sind Textdateien, die auf Ihrem Computer gespeichert werden und die eine Analyse der Benutzung der Website durch Sie ermöglichen. Die Nutzung dieses Dienstes erfolgt auf Grundlage Ihrer Einwilligung nach <strong>Art. 6 Abs. 1 lit. a DSGVO</strong> und <strong>§ 25 Abs. 1 TDDDG</strong>. Die Einwilligung ist jederzeit widerrufbar.</p>
            <p>Wir haben die Funktion <strong>IP-Anonymisierung</strong> aktiviert. Dadurch wird Ihre IP-Adresse von Google innerhalb von EU-Mitgliedstaaten vor der Übermittlung in die USA gekürzt. Mehr Informationen finden Sie in der Datenschutzerklärung von Google: <a href="https://policies.google.com/privacy?hl=de" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy?hl=de</a>.</p>

            <h3>Sentry</h3>
            <p>Wir nutzen den Dienst Sentry (Functional Software Inc., USA), um die technische Stabilität unserer Website zu überwachen und Fehler im Code zu identifizieren.</p>
            <p>Sentry kann <strong>Cookies</strong> einsetzen, um Fehlerereignisse zu analysieren. Die Nutzung erfolgt auf Grundlage unseres berechtigten Interesses an einer technisch einwandfreien Website (Art. 6 Abs. 1 lit. f DSGVO) oder, sofern abgefragt, auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Datenübertragungen in die USA sind durch Standardvertragsklauseln abgesichert. Weitere Informationen: <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer">https://sentry.io/privacy/</a>.</p>

            <h3>Google Fonts (lokales Hosting)</h3>
            <p>Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten Google Fonts, die lokal installiert sind. Eine Verbindung zu Servern von Google findet nicht statt.</p>

            <div className="mt-12 pt-8 border-t border-white/10">
                <h1>Impressum</h1>
                <h2>Angaben gemäß § 5 TMG</h2>
                <p>
                    Kay Engelhardt<br />
                    c/o Nordbahnstudios<br />
                    Wollankstr 101<br />
                    13187 Berlin
                </p>

                <h2>Kontakt</h2>
                <p>
                    E-Mail: hello@heistology.com
                </p>

                <h2>Redaktionell verantwortlich</h2>
                <p>
                    Kay Engelhardt<br />
                    Wollankstr 101<br />
                    13187 Berlin
                </p>

                <h2>EU-Streitbeilegung</h2>
                <p>
                    Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                    <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer"> https://ec.europa.eu/consumers/odr/</a>.<br />
                    Unsere E-Mail-Adresse finden Sie oben im Impressum.
                </p>

                <h2>Verbraucher­streit­beilegung/Universal-Schlichtungs­stelle</h2>
                <p>
                    Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                </p>

                <h2>Haftung für Inhalte</h2>
                <p>
                    Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                </p>

                <h2>Haftung für Links</h2>
                <p>
                    Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                </p>

                <h2>Urheberrecht</h2>
                <p>
                    Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
                </p>
            </div>
        </>
    );

    const renderEnglishContent = () => (
        <>
            <h1>Privacy Policy</h1>

            <h2>1. Privacy at a glance</h2>
            <h3>General information</h3>
            <p>The following notes provide a simple overview of what happens to your personal data when you visit this website. Personal data is any data with which you can be personally identified. Detailed information on the subject of data protection can be found in our privacy policy listed below this text.</p>

            <h3>Data collection on this website</h3>
            <strong>Who is responsible for data collection on this website?</strong>
            <p>Data processing on this website is carried out by the website operator. You can find their contact details in the "Note on the responsible body" section of this privacy policy.</p>

            <strong>How do we collect your data?</strong>
            <p>Your data is collected on the one hand by you communicating it to us. This can be, for example, data that you enter in a contact form.</p>
            <p>Other data is collected automatically or after your consent when you visit the website by our IT systems. These are primarily technical data (e.g. internet browser, operating system or time of the page view). This data is collected automatically as soon as you enter this website.</p>

            <strong>What do we use your data for?</strong>
            <p>Part of the data is collected to ensure error-free provision of the website. Other data can be used to analyze your user behavior. If contracts can be concluded or initiated via the website, the transmitted data will also be processed for contract offers, orders or other order inquiries.</p>

            <strong>What rights do you have regarding your data?</strong>
            <p>You have the right at any time to receive information about the origin, recipient and purpose of your stored personal data free of charge. You also have a right to request the correction or deletion of this data. If you have given your consent to data processing, you can revoke this consent at any time for the future. You also have the right to request the restriction of the processing of your personal data under certain circumstances. Furthermore, you have the right to lodge a complaint with the competent supervisory authority.</p>

            <h2>2. Hosting</h2>
            <p>We host the content of our website with the following provider:</p>
            <h3>External Hosting</h3>
            <p>This website is hosted externally. The personal data collected on this website is stored on the servers of the host. This can primarily be IP addresses, contact requests, meta and communication data, contract data, contact details, names, website access and other data generated via a website.</p>
            <p>External hosting is for the purpose of fulfilling contracts with our potential and existing customers (Art. 6 Para. 1 lit. b GDPR) and in the interest of a secure, fast and efficient provision of our online offer by a professional provider (Art. 6 Para. 1 lit. f GDPR).</p>
            <p>If a corresponding consent has been requested, processing takes place exclusively on the basis of Art. 6 Para. 1 lit. a GDPR and § 25 Para. 1 TDDDG. Consent can be revoked at any time.</p>
            <p><strong>Host used:</strong><br />
                manitu GmbH<br />
                Welvertstraße 2<br />
                66606 St. Wendel, Germany</p>

            <h2>3. General information and mandatory information</h2>
            <h3>Data protection</h3>
            <p>The operators of these pages take the protection of your personal data very seriously. We treat your personal data confidentially and in accordance with the statutory data protection regulations and this privacy policy.</p>
            <p>Note on the responsible body:</p>
            <p>
                <strong>Kay Engelhardt</strong><br />
                c/o Nordbahnstudios<br />
                Wollankstr 101<br />
                13187 Berlin, Germany<br />
                Email: hello@heistology.com
            </p>

            <h3>Right to object to data collection in special cases and to direct advertising (Art. 21 GDPR)</h3>
            <p>IF DATA PROCESSING IS BASED ON ART. 6 PARA. 1 LIT. E OR F GDPR, YOU HAVE THE RIGHT AT ANY TIME TO OBJECT TO THE PROCESSING OF YOUR PERSONAL DATA FOR REASONS ARISING FROM YOUR PARTICULAR SITUATION...</p>

            <h2>4. Data collection on this website</h2>
            <h3>Contact form / inquiry by email</h3>
            <p>If you send us inquiries via the contact form or email, your details, including the contact details you provided there, will be stored by us for the purpose of processing the inquiry. The processing of this data takes place on the basis of Art. 6 Para. 1 lit. b GDPR, if your inquiry is related to the fulfillment of a contract, or on the basis of our legitimate interest (Art. 6 Para. 1 lit. f GDPR).</p>

            <h2>5. Analysis tools and third-party tools</h2>

            <h3>GoatCounter</h3>
            <p>We use GoatCounter to analyze website traffic. GoatCounter is a privacy-friendly analytics service that <strong>does not set cookies</strong> and does not store personal data. The analysis is based purely on aggregated data. More information can be found at: <a href="https://www.goatcounter.com/privacy" target="_blank" rel="noopener noreferrer">https://www.goatcounter.com/privacy</a>.</p>

            <h3>Google Analytics</h3>
            <p>This website uses functions of the web analysis service Google Analytics. The provider is Google Ireland Limited ("Google"), Gordon House, Barrow Street, Dublin 4, Ireland.</p>
            <p>Google Analytics uses so-called <strong>"Cookies"</strong>. These are text files that are stored on your computer and allow an analysis of your use of the website. The use of this service is based on your consent according to <strong>Art. 6 Para. 1 lit. a GDPR</strong> and <strong>§ 25 Para. 1 TDDDG</strong>. Consent can be revoked at any time.</p>
            <p>We have activated the <strong>IP anonymization</strong> function. This means that your IP address is shortened by Google within EU member states before being transmitted to the USA. More information can be found in Google's privacy policy: <a href="https://policies.google.com/privacy?hl=en" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy?hl=en</a>.</p>

            <h3>Sentry</h3>
            <p>We use the Sentry service (Functional Software Inc., USA) to monitor the technical stability of our website and identify errors in the code.</p>
            <p>Sentry can use <strong>cookies</strong> to analyze error events. The use is based on our legitimate interest in a technically flawless website (Art. 6 Para. 1 lit. f GDPR) or, if requested, on the basis of your consent (Art. 6 Para. 1 lit. a GDPR). Data transfers to the USA are secured by standard contractual clauses. More information: <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer">https://sentry.io/privacy/</a>.</p>

            <h3>Google Fonts (local hosting)</h3>
            <p>This site uses Google Fonts, which are installed locally, for the uniform presentation of fonts. A connection to Google servers does not take place.</p>

            <div className="mt-12 pt-8 border-t border-white/10">
                <h1>Legal Notice</h1>
                <h2>Information according to § 5 TMG</h2>
                <p>
                    Kay Engelhardt<br />
                    c/o Nordbahnstudios<br />
                    Wollankstr 101<br />
                    13187 Berlin, Germany
                </p>

                <h2>Contact</h2>
                <p>
                    Email: hello@heistology.com
                </p>

                <h2>Editorial Responsibility</h2>
                <p>
                    Kay Engelhardt<br />
                    Wollankstr 101<br />
                    13187 Berlin, Germany
                </p>

                <h2>EU Dispute Resolution</h2>
                <p>
                    The European Commission provides a platform for online dispute resolution (OS):
                    <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer"> https://ec.europa.eu/consumers/odr/</a>.<br />
                    Our email address can be found above in the imprint.
                </p>

                <h2>Consumer Dispute Resolution/Universal Arbitration Board</h2>
                <p>
                    We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.
                </p>

                <h2>Liability for Content</h2>
                <p>
                    As a service provider, we are responsible for our own content on these pages according to § 7 Para. 1 TMG under general laws. According to §§ 8 to 10 TMG, however, we as service providers are not obliged to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.
                </p>

                <h2>Liability for Links</h2>
                <p>
                    Our offer contains links to external websites of third parties, on whose content we have no influence. Therefore, we cannot assume any liability for this external content. The respective provider or operator of the pages is always responsible for the content of the linked pages.
                </p>

                <h2>Copyright</h2>
                <p>
                    The content and works created by the site operators on these pages are subject to German copyright law. Duplication, processing, distribution and any kind of exploitation outside the limits of copyright law require the written consent of the respective author or creator. Downloads and copies of this site are only permitted for private, non-commercial use.
                </p>
            </div>
        </>
    );

    return (
        <div
            className="fixed inset-0 bg-[#05070a]/95 z-[500] flex items-center justify-center p-0 md:p-8 overflow-hidden backdrop-blur-md"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl max-h-[90vh] bg-[#05070a] text-[#e0e6ed] border border-white/10 rounded-none md:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-[fade-in_0.3s_ease-out]"
                style={{
                    fontFamily: "'Outfit', sans-serif",
                    backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(0, 140, 255, 0.1) 0%, transparent 50%)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative p-8 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white mb-1 uppercase">
                            {lang === 'de' ? 'Impressum' : 'Imprint'}
                        </h1>
                        <p className="text-[#94a3b8] text-xs uppercase tracking-[0.2em] font-medium">
                            {lang === 'de' ? 'Rechtliche Informationen' : 'Legal Information'}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-[#008cff] hover:border-[#008cff] transition-all group"
                        aria-label="Close Imprint"
                    >
                        <span className="text-xl group-hover:scale-110">✕</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 text-sm leading-relaxed">
                    {/* Imprint Content with proper styling */}
                    <div id="imprint-content" className="space-y-4">
                        <style>{`
                            #imprint-content h1 {
                                font-size: 1.5rem;
                                font-weight: 700;
                                color: #ffffff;
                                margin-bottom: 1rem;
                                margin-top: 1.5rem;
                            }
                            #imprint-content h2 {
                                font-size: 1.25rem;
                                font-weight: 600;
                                color: #e0e6ed;
                                margin-top: 1.5rem;
                                margin-bottom: 0.75rem;
                            }
                            #imprint-content h3 {
                                font-size: 1.1rem;
                                font-weight: 600;
                                color: #cbd5e1;
                                margin-top: 1rem;
                                margin-bottom: 0.5rem;
                            }
                            #imprint-content p {
                                color: #94a3b8;
                                margin-bottom: 0.75rem;
                                line-height: 1.6;
                            }
                            #imprint-content strong {
                                color: #cbd5e1;
                                font-weight: 600;
                                display: block;
                                margin-top: 0.75rem;
                                margin-bottom: 0.25rem;
                            }
                            #imprint-content a {
                                color: #008cff;
                                text-decoration: underline;
                            }
                            #imprint-content a:hover {
                                color: #0099ff;
                            }
                        `}</style>

                        {lang === 'de' ? renderGermanContent() : renderEnglishContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};
