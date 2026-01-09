<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Low Stock Notification</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
        }
        .email-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .email-body {
            padding: 30px 20px;
        }
        .alert-box {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin-bottom: 25px;
            border-radius: 4px;
        }
        .alert-box h2 {
            margin: 0 0 10px 0;
            color: #856404;
            font-size: 20px;
        }
        .product-info {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #495057;
        }
        .info-value {
            color: #212529;
        }
        .stock-warning {
            color: #dc3545;
            font-weight: 600;
            font-size: 18px;
        }
        .action-button {
            display: inline-block;
            background-color: #667eea;
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
            font-weight: 600;
        }
        .action-button:hover {
            background-color: #5568d3;
        }
        .email-footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        @media only screen and (max-width: 600px) {
            .email-body {
                padding: 20px 15px;
            }
            .info-row {
                flex-direction: column;
            }
            .info-value {
                margin-top: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>⚠️ Low Stock Alert</h1>
        </div>
        
        <div class="email-body">
            <div class="alert-box">
                <h2>Action Required</h2>
                <p style="margin: 0; color: #856404;">
                    One of your products has fallen below the low stock threshold and requires your attention.
                </p>
            </div>

            <div class="product-info">
                <div class="info-row">
                    <span class="info-label">Product Name:</span>
                    <span class="info-value">
                        @if($item instanceof \App\Models\ProductVariant)
                            {{ $item->product->name }}
                        @else
                            {{ $item->name }}
                        @endif
                    </span>
                </div>
                
                @if($item instanceof \App\Models\ProductVariant)
                <div class="info-row">
                    <span class="info-label">Variant:</span>
                    <span class="info-value">
                        @foreach($item->attributes as $attribute)
                            {{ $attribute->name }}: {{ $attribute->pivot->value }}
                            @if(!$loop->last), @endif
                        @endforeach
                    </span>
                </div>
                @endif
                
                <div class="info-row">
                    <span class="info-label">SKU:</span>
                    <span class="info-value">{{ $item->sku ?? 'N/A' }}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Current Stock:</span>
                    <span class="info-value stock-warning">{{ $currentStock }} units</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Low Stock Threshold:</span>
                    <span class="info-value">{{ $threshold }} units</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Price:</span>
                    <span class="info-value">${{ number_format($item->price, 2) }}</span>
                </div>
            </div>

            <p style="margin-top: 25px; color: #495057;">
                Please review the inventory levels and consider restocking this product to avoid potential stockouts.
            </p>

            <div style="text-align: center; margin-top: 30px;">
                <a href="{{ url('/admin/products') }}" class="action-button">
                    Manage Products
                </a>
            </div>
        </div>

        <div class="email-footer">
            <p style="margin: 0;">
                This is an automated notification from your e-commerce system.<br>
                You are receiving this because you are an administrator.
            </p>
        </div>
    </div>
</body>
</html>
