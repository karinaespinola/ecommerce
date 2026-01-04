# E-Commerce Platform

A modern, full-stack e-commerce platform built with Laravel and React, featuring an admin dashboard for product management and a customer-facing storefront that supports both guest checkout and authenticated user purchases.

## Purpose

This platform provides a complete e-commerce solution with two main interfaces:

1. **Customer Storefront**: A public-facing website where users can:
   - Browse products and categories
   - Add items to a shopping cart
   - Make purchases as **guests** (without creating an account)
   - Make purchases as **logged-in users** (with account benefits)
   - View order history (for authenticated users)

2. **Admin Dashboard**: A protected administrative interface where authorized users can:
   - Manage product catalog (products, categories, variants)
   - Handle product attributes and images
   - Monitor orders and inventory
   - Configure platform settings

## Technologies Used

### Backend

- **Laravel 12**: Modern PHP framework providing robust backend architecture, routing, and ORM
- **PHP 8.2+**: Latest PHP version with improved performance and type safety
- **Laravel Fortify**: Authentication system handling login, registration, password reset, and two-factor authentication
- **Inertia.js**: Seamlessly connects Laravel backend with React frontend, eliminating the need for a separate API
- **SQLite**: Default database for development (easily configurable for production with MySQL/PostgreSQL)

### Frontend

- **React 19**: Modern React library for building interactive user interfaces
- **TypeScript**: Type-safe JavaScript for better code quality and developer experience
- **Inertia.js React**: React adapter for Inertia.js, enabling server-driven React components
- **Tailwind CSS 4**: Utility-first CSS framework for rapid UI development
- **Vite**: Fast build tool and development server
- **Radix UI**: Accessible, unstyled component primitives for building UI components
- **Headless UI**: Completely unstyled, fully accessible UI components
- **Lucide React**: Beautiful icon library

### Development Tools

- **Pest PHP**: Modern PHP testing framework with an elegant syntax
- **Laravel Pint**: Opinionated PHP code style fixer
- **ESLint & Prettier**: Code quality and formatting tools for JavaScript/TypeScript
- **Laravel Wayfinder**: Type-safe route generation for TypeScript

## Key Features

### User Authentication
- User registration and login
- Password reset functionality
- Two-factor authentication support
- Email verification
- Session management

### E-Commerce Functionality
- **Product Catalog**: Browse products organized by categories
- **Product Variants**: Products with multiple attributes (size, color, etc.)
- **Shopping Cart**: Add, update, and remove items from cart
- **Guest Checkout**: Complete purchases without creating an account
- **Authenticated Checkout**: Enhanced experience for logged-in users
- **Order Management**: Track orders and order history
- **Image Management**: Upload and manage product images

### Admin Features
- Product CRUD operations
- Category management
- Attribute and variant management
- Image upload and organization
- Order tracking and management

## Project Structure

```
├── app/
│   ├── Http/Controllers/    # Laravel controllers
│   ├── Models/              # Eloquent models
│   ├── Services/            # Business logic services
│   └── Actions/             # Fortify authentication actions
├── resources/
│   ├── js/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Inertia page components
│   │   ├── layouts/         # Layout components
│   │   └── routes/          # Type-safe route definitions
│   └── css/                 # Global styles
├── database/
│   ├── migrations/          # Database schema migrations
│   └── seeders/             # Database seeders
└── routes/
    └── web.php              # Application routes
```

## Getting Started

### Prerequisites

- PHP 8.2 or higher
- Composer
- Node.js 18+ and npm
- SQLite (or MySQL/PostgreSQL for production)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ecommerce
```

2. Install PHP dependencies:
```bash
composer install
```

3. Install JavaScript dependencies:
```bash
npm install
```

4. Set up environment:
```bash
cp .env.example .env
php artisan key:generate
```

5. Run migrations:
```bash
php artisan migrate
```

6. Build assets:
```bash
npm run build
```

### Development

Start the development server:
```bash
composer run dev
```

This will start:
- Laravel development server
- Vite dev server for hot module replacement
- Queue worker
- Log viewer

## Testing

Run tests using Pest:
```bash
composer test
```

## Production Build

Build assets for production:
```bash
npm run build
```

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
