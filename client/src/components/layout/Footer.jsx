import { Link } from 'react-router-dom';
import { Store, Globe, AtSign, Camera, Play, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#313b30] text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl mb-4">
              <img src="https://www.iconpacks.net/icons/2/free-lipstick-icon-1598-thumb.png" className="bg-white rounded-full  h-6 w-6" />

              shopZone Cosmetics
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Your one-stop destination for quality products at great prices.
            </p>
            <div className="flex gap-3">
              {[Globe, AtSign, Camera, Play].map((Icon, i) => (
                <a key={i} href="#" className="p-2 rounded-lg bg-[#f59c03] hover:bg-[#f59e0b] transition-colors">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Home', to: '/' },
                { label: 'Products', to: '/products' },
                { label: 'About Us', to: '/about' },
                { label: 'Contact', to: '/contact' },
                { label: 'Become a Seller', to: '/seller/register' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-indigo-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'My Account', to: '/account' },
                { label: 'Order Tracking', to: '/account/orders' },
                { label: 'Returns & Refunds', to: '/returns' },
                { label: 'FAQ', to: '/faq' },
                { label: 'Privacy Policy', to: '/privacy' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-indigo-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#f59e0b] flex-shrink-0" />
                support@shopZone Cosmetics.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#f59e0b] flex-shrink-0" />
                +25193123456
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                Addis ababa
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} shopZone Cosmetics. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <Link to="/cookies" className="hover:text-gray-300 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
