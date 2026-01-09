import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CarouselSlide {
    id: number;
    image: string;
    title: string;
    subtitle?: string;
    description?: string;
    ctaText?: string;
    ctaLink?: string;
}

interface HeroCarouselProps {
    slides?: CarouselSlide[];
}

// Default slides - supports both external URLs and local storage paths
// Examples:
// - External URL: 'https://example.com/image.jpg'
// - Local storage: '/storage/website/hero-1.png'
// - CDN URL: 'https://cdn.example.com/image.jpg'
const defaultSlides: CarouselSlide[] = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=600&fit=crop',
        title: '#Big Fashion Sale',
        subtitle: 'Limited Time Offer!',
        description: 'Up to 50% OFF!',
        ctaText: 'Shop Now',
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=600&fit=crop',
        title: 'New Collection',
        subtitle: 'Discover the Latest Trends',
        description: 'Redefine Your Everyday Style',
        ctaText: 'Explore',
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&h=600&fit=crop',
        title: 'Premium Quality',
        subtitle: 'Shop with Confidence',
        description: 'Best Products, Best Prices',
        ctaText: 'Browse',
    },
];

export default function HeroCarousel({ slides = defaultSlides }: HeroCarouselProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    // Debug: Log current slide on mount and changes
    useEffect(() => {
        console.log('🎠 Carousel mounted. Current slide:', currentSlide, 'Total slides:', slides.length);
        console.log('🎠 First slide image:', slides[0]?.image);
    }, []);

    useEffect(() => {
        console.log('🎠 Slide changed to:', currentSlide, 'Image:', slides[currentSlide]?.image);
    }, [currentSlide]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000); // 5 second intervals

        return () => clearInterval(interval);
    }, [isAutoPlaying, slides.length]);

    // Pause auto-play on hover
    const handleMouseEnter = () => setIsAutoPlaying(false);
    const handleMouseLeave = () => setIsAutoPlaying(true);

    return (
        <div
            className="relative rounded-lg overflow-hidden min-h-[400px] flex items-center mb-12"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Slides */}
            <div className="relative w-full h-full min-h-[400px]">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                    >
                        {/* Background Image */}
                        {imageErrors.has(slide.id) ? (
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                                <div className="text-white text-center p-4">
                                    <p className="text-sm">Image not found</p>
                                    <p className="text-xs mt-2 opacity-75">{slide.image}</p>
                                </div>
                            </div>
                        ) : (
                            <img
                                src={slide.image}
                                alt={slide.title}
                                className="absolute inset-0 w-full h-full object-cover"
                                style={{ 
                                    minHeight: '400px',
                                    display: index === currentSlide ? 'block' : 'none'
                                }}
                                onLoad={() => {
                                    console.log('✅ Image loaded successfully:', slide.image, 'Index:', index, 'Current:', currentSlide);
                                    setImageErrors((prev) => {
                                        const newSet = new Set(prev);
                                        newSet.delete(slide.id);
                                        return newSet;
                                    });
                                }}
                                onError={(e) => {
                                    console.error('❌ Image failed to load:', slide.image, 'Error:', e);
                                    setImageErrors((prev) => new Set(prev).add(slide.id));
                                    // Fallback to gradient if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        )}
                        {/* Overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30"></div>
                        
                        {/* Content */}
                        <div className="relative z-10 max-w-2xl text-white p-12 h-full flex items-center">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
                                    {slide.title}
                                </h1>
                                {slide.subtitle && (
                                    <p className="text-xl md:text-2xl mb-2 animate-fade-in-delay-1">
                                        {slide.subtitle}
                                    </p>
                                )}
                                {slide.description && (
                                    <p className="text-lg md:text-xl mb-6 animate-fade-in-delay-2">
                                        {slide.description}
                                    </p>
                                )}
                                {slide.ctaText && (
                                    <Button
                                        size="lg"
                                        className="mt-4 animate-fade-in-delay-3"
                                        onClick={() => {
                                            if (slide.ctaLink) {
                                                window.location.href = slide.ctaLink;
                                            }
                                        }}
                                    >
                                        {slide.ctaText}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-900 rounded-full p-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                aria-label="Previous slide"
            >
                <ChevronLeft className="h-6 w-6" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-900 rounded-full p-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                aria-label="Next slide"
            >
                <ChevronRight className="h-6 w-6" />
            </button>

            {/* Indicator Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`transition-all duration-300 rounded-full ${
                            index === currentSlide
                                ? 'w-8 h-2 bg-white'
                                : 'w-2 h-2 bg-white/50 hover:bg-white/75'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
