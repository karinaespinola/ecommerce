<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Orders Report</title>
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
            max-width: 800px;
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
        .email-header .date {
            margin-top: 10px;
            font-size: 16px;
            opacity: 0.9;
        }
        .email-body {
            padding: 30px 20px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .stat-card .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 5px;
        }
        .stat-card .stat-label {
            font-size: 14px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #495057;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }
        .orders-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background-color: #ffffff;
        }
        .orders-table th {
            background-color: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
        }
        .orders-table td {
            padding: 12px;
            border-bottom: 1px solid #e9ecef;
        }
        .orders-table tr:hover {
            background-color: #f8f9fa;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }
        .status-completed {
            background-color: #d4edda;
            color: #155724;
        }
        .status-cancelled {
            background-color: #f8d7da;
            color: #721c24;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .money {
            font-weight: 600;
            color: #28a745;
        }
        .top-products-list {
            list-style: none;
            padding: 0;
        }
        .top-products-list li {
            padding: 12px;
            background-color: #f8f9fa;
            margin-bottom: 8px;
            border-radius: 6px;
            border-left: 3px solid #667eea;
        }
        .product-name {
            font-weight: 600;
            color: #495057;
        }
        .product-details {
            font-size: 14px;
            color: #6c757d;
            margin-top: 4px;
        }
        .no-orders {
            text-align: center;
            padding: 40px 20px;
            color: #6c757d;
        }
        .no-orders-icon {
            font-size: 48px;
            margin-bottom: 15px;
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
            .stats-grid {
                grid-template-columns: 1fr;
            }
            .orders-table {
                font-size: 12px;
            }
            .orders-table th,
            .orders-table td {
                padding: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>📊 Daily Orders Report</h1>
            <div class="date">{{ $reportData['date_formatted'] ?? 'Today' }}</div>
        </div>
        
        <div class="email-body">
            @if($reportData['statistics']['total_orders'] > 0)
                <!-- Statistics Section -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">{{ $reportData['statistics']['total_orders'] }}</div>
                        <div class="stat-label">Total Orders</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value money">${{ number_format($reportData['statistics']['total_revenue'], 2) }}</div>
                        <div class="stat-label">Total Revenue</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value money">${{ number_format($reportData['statistics']['average_order_value'], 2) }}</div>
                        <div class="stat-label">Avg Order Value</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ $reportData['statistics']['registered_orders'] }}</div>
                        <div class="stat-label">Registered</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ $reportData['statistics']['guest_orders'] }}</div>
                        <div class="stat-label">Guest Orders</div>
                    </div>
                </div>

                <!-- Financial Breakdown -->
                <div class="section">
                    <h2 class="section-title">Financial Breakdown</h2>
                    <table class="orders-table">
                        <tr>
                            <td><strong>Subtotal:</strong></td>
                            <td class="text-right money">${{ number_format($reportData['statistics']['total_subtotal'], 2) }}</td>
                        </tr>
                        <tr>
                            <td><strong>Tax:</strong></td>
                            <td class="text-right money">${{ number_format($reportData['statistics']['total_tax'], 2) }}</td>
                        </tr>
                        <tr>
                            <td><strong>Shipping:</strong></td>
                            <td class="text-right money">${{ number_format($reportData['statistics']['total_shipping'], 2) }}</td>
                        </tr>
                        <tr style="background-color: #f8f9fa;">
                            <td><strong>Total Revenue:</strong></td>
                            <td class="text-right money" style="font-size: 18px;">${{ number_format($reportData['statistics']['total_revenue'], 2) }}</td>
                        </tr>
                    </table>
                </div>

                <!-- Orders by Status -->
                @if(!empty($reportData['orders_by_status']))
                <div class="section">
                    <h2 class="section-title">Orders by Status</h2>
                    <table class="orders-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th class="text-right">Count</th>
                                <th class="text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($reportData['orders_by_status'] as $status => $data)
                            <tr>
                                <td>
                                    <span class="status-badge status-{{ strtolower($status) }}">
                                        {{ ucfirst($status) }}
                                    </span>
                                </td>
                                <td class="text-right">{{ $data['count'] }}</td>
                                <td class="text-right money">${{ number_format($data['revenue'], 2) }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                @endif

                <!-- Top Products -->
                @if(!empty($reportData['top_products']) && count($reportData['top_products']) > 0)
                <div class="section">
                    <h2 class="section-title">Top Products Sold</h2>
                    <ul class="top-products-list">
                        @foreach($reportData['top_products'] as $product)
                        <li>
                            <div class="product-name">
                                {{ $product->product_name }}
                                @if($product->variant_name)
                                    - {{ $product->variant_name }}
                                @endif
                            </div>
                            <div class="product-details">
                                Quantity: <strong>{{ $product->total_quantity }}</strong> | 
                                Revenue: <strong class="money">${{ number_format($product->total_revenue, 2) }}</strong>
                            </div>
                        </li>
                        @endforeach
                    </ul>
                </div>
                @endif

                <!-- Orders List -->
                <div class="section">
                    <h2 class="section-title">All Orders ({{ count($reportData['orders']) }})</h2>
                    <table class="orders-table">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Customer</th>
                                <th>Status</th>
                                <th>Items</th>
                                <th class="text-right">Total</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($reportData['orders'] as $order)
                            <tr>
                                <td><strong>{{ $order['order_number'] }}</strong></td>
                                <td>
                                    {{ $order['customer_name'] }}
                                    @if($order['is_guest'])
                                        <span style="font-size: 11px; color: #6c757d;">(Guest)</span>
                                    @endif
                                    <br>
                                    <small style="color: #6c757d;">{{ $order['customer_email'] }}</small>
                                </td>
                                <td>
                                    <span class="status-badge status-{{ strtolower($order['status']) }}">
                                        {{ ucfirst($order['status']) }}
                                    </span>
                                </td>
                                <td class="text-center">{{ $order['items_count'] }}</td>
                                <td class="text-right money">${{ number_format($order['total'], 2) }}</td>
                                <td><small>{{ $order['created_at_formatted'] }}</small></td>
                            </tr>
                            @endforeach
                        </tbody>
                        <tfoot>
                            <tr style="background-color: #f8f9fa; font-weight: 600;">
                                <td colspan="4" class="text-right">Total:</td>
                                <td class="text-right money" style="font-size: 16px;">${{ number_format($reportData['statistics']['total_revenue'], 2) }}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            @else
                <div class="no-orders">
                    <div class="no-orders-icon">📭</div>
                    <h2>No Orders Today</h2>
                    <p>There were no orders placed on {{ $reportData['date_formatted'] ?? 'this day' }}.</p>
                </div>
            @endif
        </div>

        <div class="email-footer">
            <p style="margin: 0;">
                This is an automated daily report from your e-commerce system.<br>
                Generated on {{ now()->format('F j, Y \a\t g:i A') }}
            </p>
        </div>
    </div>
</body>
</html>
