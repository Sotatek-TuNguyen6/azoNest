// Interface cho PayPal Order API Response
export interface PayPalOrder {
  id: string; // ID của đơn hàng
  status: string; // Trạng thái của đơn hàng (e.g. 'COMPLETED', 'APPROVED')
  intent: string; // Mục đích của đơn hàng (e.g. 'CAPTURE')
  purchase_units: PurchaseUnit[]; // Danh sách các đơn vị mua hàng
  payer: Payer; // Thông tin người thanh toán
  create_time: string; // Thời gian tạo đơn hàng
  update_time: string; // Thời gian cập nhật đơn hàng
  links: PayPalLink[]; // Các liên kết tới các thao tác tiếp theo (e.g. approve, capture)
}

export interface PurchaseUnit {
  reference_id: string; // Mã tham chiếu cho đơn vị mua hàng
  amount: Amount; // Số tiền của đơn vị mua hàng
  payee: Payee; // Thông tin người nhận thanh toán
  description?: string; // Mô tả đơn hàng
  items?: Item[]; // Danh sách các mục trong đơn hàng
  shipping?: Shipping; // Thông tin vận chuyển (nếu có)
  payments?: PaymentDetails; // Chi tiết thanh toán (nếu đã thanh toán)
}

export interface Amount {
  currency_code: string; // Mã đơn vị tiền tệ (e.g. 'USD')
  value: string; // Giá trị của đơn hàng (e.g. '100.00')
  breakdown?: Breakdown; // Chi tiết chia nhỏ giá trị (nếu có)
}

export interface Breakdown {
  item_total?: Money; // Tổng giá trị của các mục hàng
  shipping?: Money; // Phí vận chuyển
  tax_total?: Money; // Tổng thuế
}

export interface Money {
  currency_code: string; // Mã đơn vị tiền tệ
  value: string; // Giá trị
}

export interface Payee {
  email_address: string; // Địa chỉ email của người nhận thanh toán
  merchant_id: string; // ID của người nhận thanh toán
}

export interface Item {
  name: string; // Tên sản phẩm
  quantity: string; // Số lượng
  unit_amount: Money; // Giá của mỗi đơn vị sản phẩm
}

export interface Shipping {
  name: {
    full_name: string; // Tên đầy đủ người nhận
  };
  address: Address; // Địa chỉ vận chuyển
}

export interface Address {
  address_line_1: string; // Dòng địa chỉ 1
  address_line_2?: string; // Dòng địa chỉ 2 (nếu có)
  admin_area_1: string; // Tên vùng/hành chính (e.g. bang, tỉnh)
  admin_area_2: string; // Thành phố/quận/huyện
  postal_code: string; // Mã bưu chính
  country_code: string; // Mã quốc gia (e.g. 'US')
}

export interface PaymentDetails {
  captures?: Capture[]; // Chi tiết các lần capture thanh toán
}

export interface Capture {
  id: string; // ID của capture
  status: string; // Trạng thái của capture (e.g. 'COMPLETED')
  amount: Money; // Số tiền capture
  final_capture: boolean; // Đây có phải là capture cuối cùng không
  seller_protection: SellerProtection; // Bảo vệ người bán (nếu có)
  create_time: string; // Thời gian capture được tạo
  update_time: string; // Thời gian capture được cập nhật
}

export interface SellerProtection {
  status: string; // Trạng thái bảo vệ người bán
  dispute_categories: string[]; // Các danh mục tranh chấp
}

export interface Payer {
  name: {
    given_name: string; // Tên
    surname: string; // Họ
  };
  email_address: string; // Email của người thanh toán
  payer_id: string; // ID của người thanh toán
  address?: Address; // Địa chỉ của người thanh toán (nếu có)
}

export interface PayPalLink {
  href: string; // URL của liên kết
  rel: string; // Mô tả hành động (e.g. 'approve', 'self')
  method: string; // Phương thức HTTP (e.g. 'GET', 'POST')
}
