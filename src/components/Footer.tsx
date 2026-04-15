import { Github } from 'react-bootstrap-icons';

const Footer = () => (
    <footer className="text-center py-3 mt-4">
        <a
            href="https://github.com/Klice/etradecad"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
        >
            <Github size={16} className="me-1" />
            View on GitHub
        </a>
    </footer>
);

export default Footer;
