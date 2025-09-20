import { Button } from "@/components/ui/button";
import { Sparkles, Star, Palette, Gift, Users, Clock, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-gradient-wax-hands flex items-center justify-center overflow-hidden">
      {/* Animated Background Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 2}s`,
            }}
          >
            <Star
              className="text-yellow-400/40 w-4 h-4"
              fill="currentColor"
            />
          </div>
        ))}
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-bounce-gentle">
        <div className="bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full p-4 shadow-glow">
          <Palette className="w-8 h-8 text-white" />
        </div>
      </div>

      <div className="absolute top-40 right-20 animate-float">
        <div className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-full p-3 shadow-glow">
          <Gift className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="absolute bottom-40 left-20 animate-bounce-gentle" style={{ animationDelay: '1s' }}>
        <div className="bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full p-3 shadow-glow">
          <Users className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Text */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-card border border-orange-200">
                <Sparkles className="w-6 h-6 text-orange-600 animate-spin-slow" />
                <span className="text-lg font-semibold text-gray-800">
                  🎨 Творческие мастер-классы для детей
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-orange-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
                  Восковые
                </span>
                <br />
                <span className="text-gray-800">Ручки</span>
                <br />
                <span className="text-3xl md:text-4xl text-gray-600 font-normal">
                  ✨ Магия творчества ✨
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 max-w-2xl leading-relaxed">
                Создай свою уникальную 3D копию руки в восковом исполнении!
                Приезжаем в школы и детские сады. Незабываемые впечатления и
                уникальные сувениры за 5 минут! 🎉
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
              <Button
                variant="hero"
                size="xl"
                className="group text-lg py-6 px-8 bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white shadow-glow transform hover:scale-105 transition-all duration-300"
                asChild
              >
                <a href="/register">
                  <Palette className="w-6 h-6 group-hover:animate-bounce-gentle mr-3" />
                  Записаться на мастер-класс
                </a>
              </Button>

              <Button
                variant="workshop"
                size="xl"
                className="text-lg py-6 px-8 bg-white/90 hover:bg-white text-gray-800 border-2 border-orange-300 hover:border-orange-400 shadow-card transform hover:scale-105 transition-all duration-300"
                asChild
              >
                <a href="/login">
                  Войти в систему
                </a>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
              <div className="text-center group">
                <div className="text-3xl font-bold text-orange-600 group-hover:scale-110 transition-transform duration-200">5 мин</div>
                <div className="text-sm text-gray-600">Время создания</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl font-bold text-purple-600 group-hover:scale-110 transition-transform duration-200">100000+</div>
                <div className="text-sm text-gray-600">Довольных детей</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-200">3+</div>
                <div className="text-sm text-gray-600">Возраст детей</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl font-bold text-green-600 group-hover:scale-110 transition-transform duration-200">1200+</div>
                <div className="text-sm text-gray-600">Школ и садов</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-glow transform hover:scale-105 transition-transform duration-500">
              <img
                src={heroImage}
                alt="Детские восковые ручки - творческий мастер-класс"
                className="w-full h-[500px] md:h-[700px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 via-purple-500/10 to-transparent" />

              {/* Overlay Elements */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-card">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-semibold text-gray-800">5 минут</span>
                </div>
              </div>

              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-card">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-800">В школе</span>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-card">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-800">Группа</span>
                </div>
              </div>
            </div>

            {/* Floating Elements around image */}
            <div className="absolute -top-6 -right-6 animate-bounce-gentle">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full p-4 shadow-glow">
                <Star className="w-8 h-8 text-white" fill="currentColor" />
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 animate-float">
              <div className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-full p-4 shadow-glow">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="absolute top-1/2 -right-8 animate-bounce-gentle" style={{ animationDelay: '0.5s' }}>
              <div className="bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full p-3 shadow-glow">
                <Gift className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-orange-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-orange-400 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;