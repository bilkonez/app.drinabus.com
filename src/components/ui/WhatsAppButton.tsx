import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const phoneNumber = '38762888702';
  const message = 'Zdravo, želim da se informišem o vašim uslugama prevoza.';
  
  const handleClick = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed right-6 bottom-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6 group-hover:animate-pulse" />
      <span className="sr-only">WhatsApp kontakt</span>
    </button>
  );
};

export default WhatsAppButton;
