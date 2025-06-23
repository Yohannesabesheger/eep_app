const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 text-center text-sm py-4 mt-8 border-t">
      © {new Date().getFullYear()} Ethiopian Electric Power. All rights reserved.
    </footer>
  );
};

export default Footer;
