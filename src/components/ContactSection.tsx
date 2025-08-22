import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Instagram, MessageCircle, Mail, MapPin, Clock } from "lucide-react";

const ContactSection = () => {
  const contactMethods = [
    {
      icon: Phone,
      title: "Телефон",
      details: ["8-914-545-06-06", "8-914-547-06-06"],
      action: "Позвонить",
      variant: "hero" as const
    },
    {
      icon: Instagram,
      title: "Instagram", 
      details: ["@voskovye.ruchki", "@paveltyrin9522"],
      action: "Подписаться",
      variant: "playful" as const
    },
    {
      icon: MessageCircle,
      title: "VK",
      details: ["voskouruchkikhab"],
      action: "Написать",
      variant: "workshop" as const
    }
  ];

  const qrCodeUrl = "/lovable-uploads/47900363-9fb3-4fa4-9590-1c6dae708e32.png";

  return (
    <section className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">Свяжитесь</span>{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              с нами
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Выезжаем на любое мероприятие! Организуем незабываемый мастер-класс для ваших детей
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Contact Methods */}
          <div className="space-y-6">
            {contactMethods.map((method, index) => (
              <Card 
                key={index}
                className="shadow-card hover:shadow-playful transition-all duration-300 transform hover:scale-105"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-primary rounded-full p-3 shadow-playful">
                      <method.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{method.title}</h3>
                      <div className="space-y-1">
                        {method.details.map((detail, i) => (
                          <p key={i} className="text-muted-foreground">{detail}</p>
                        ))}
                      </div>
                    </div>
                    
                    <Button variant={method.variant} size="lg">
                      {method.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Additional Info */}
            <Card className="shadow-card bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">География</h4>
                      <p className="text-sm text-muted-foreground">По всему городу</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">Время работы</h4>
                      <p className="text-sm text-muted-foreground">По договоренности</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* QR Code & CTA */}
          <div className="text-center space-y-8">
            <Card className="shadow-glow transform hover:scale-105 transition-transform duration-300 max-w-md mx-auto">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-3">QR-код для быстрой связи</h3>
                  <p className="text-muted-foreground text-sm">
                    Отсканируйте код и узнайте всю информацию
                  </p>
                </div>
                
                <div className="bg-background rounded-2xl p-4 mb-6">
                  <img 
                    src={qrCodeUrl}
                    alt="QR код для связи"
                    className="w-full max-w-48 mx-auto rounded-lg"
                  />
                </div>
                
                <Button variant="rainbow" size="xl" className="w-full">
                  <Mail className="w-5 h-5" />
                  Связаться сейчас
                </Button>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <div className="bg-card rounded-2xl p-6 shadow-card">
              <h3 className="text-xl font-bold mb-3">Готовы к творчеству?</h3>
              <p className="text-muted-foreground mb-4">
                Оставьте заявку, и мы организуем незабываемый мастер-класс в вашей школе или детском саду
              </p>
              <Button variant="hero" size="xl" className="w-full">
                Оставить заявку
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;