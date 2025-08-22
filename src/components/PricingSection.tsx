import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Star, Sparkles } from "lucide-react";

const PricingSection = () => {
  const services = [
    {
      title: "Обычная рука",
      price: "400 руб.",
      description: "Классическая восковая копия руки",
      popular: false,
    },
    {
      title: "Световая рука", 
      price: "550 руб.",
      description: "Светодиод, который мигает различными цветами",
      popular: true,
    },
    {
      title: "Двойные руки",
      price: "800 руб.", 
      description: "Две руки в одном изделии",
      popular: false,
    },
    {
      title: "Двойные руки световые",
      price: "1000 руб.",
      description: "Два светодиода, которые мигают различными цветами",
      popular: false,
    }
  ];

  const addOns = [
    { title: "Коробочка под руку", price: "200 руб.", description: "Защитная коробка с 3 окнами и ручками" },
    { title: "Лакировка", price: "150 руб.", description: "Придает блеск и прочность" },
    { title: "Лакировка с блестками", price: "200 руб.", description: "Лак с блестками для особого эффекта" },
    { title: "Обычная надпись", price: "50 руб.", description: "Персональная надпись на изделии" },
    { title: "Светящаяся надпись", price: "100 руб.", description: "Надпись, светящаяся в темноте" },
    { title: "Наклейка на руку", price: "50 руб.", description: "Декоративная наклейка" },
    { title: "Наклейка объёмная", price: "100 руб.", description: "3D наклейка для особого эффекта" }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-card shadow-card rounded-full px-4 py-2 mb-4">
            <Star className="w-5 h-5 text-primary animate-spin-slow" fill="currentColor" />
            <span className="text-sm font-medium">Наши цены</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Выберите
            </span>{" "}
            <span className="text-foreground">свой стиль</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Создайте уникальный сувенир с различными эффектами и дополнениями
          </p>
        </div>

        {/* Main Services */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {services.map((service, index) => (
            <Card 
              key={index}
              className={`relative transform transition-all duration-300 hover:scale-105 ${
                service.popular 
                  ? 'shadow-glow ring-2 ring-primary/50' 
                  : 'shadow-card hover:shadow-playful'
              }`}
            >
              {service.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium shadow-playful">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    Популярное
                  </div>
                </div>
              )}
              
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                <div className="text-3xl font-bold text-primary mb-3">{service.price}</div>
                <p className="text-muted-foreground text-sm mb-6">{service.description}</p>
                
                <Button 
                  variant={service.popular ? "hero" : "workshop"} 
                  size="lg" 
                  className="w-full"
                >
                  Выбрать
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="bg-gradient-hero rounded-3xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Дополнительные опции</h3>
            <p className="text-muted-foreground">Сделайте ваш сувенир еще более особенным</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {addOns.map((addon, index) => (
              <Card key={index} className="shadow-card hover:shadow-playful transition-shadow duration-300">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm">{addon.title}</h4>
                    <span className="text-primary font-bold text-sm">{addon.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{addon.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="rainbow" size="xl">
              <Sparkles className="w-5 h-5" />
              Записаться на мастер-класс
            </Button>
          </div>
        </div>

        {/* Notice */}
        <div className="mt-12 text-center">
          <div className="bg-card rounded-2xl p-6 shadow-card max-w-4xl mx-auto">
            <h4 className="font-bold text-primary mb-3">Внимание!</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Будьте аккуратны с сувениром, на морозе сувенир становится более хрупким. 
              Избегайте попадания прямых солнечных лучей. Не ставьте возле нагревательных 
              приборов или ламп накаливания.
            </p>
            <p className="text-sm text-accent font-medium mt-3">
              Записаться на мастер-класс можно в бланке у классного руководителя.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;