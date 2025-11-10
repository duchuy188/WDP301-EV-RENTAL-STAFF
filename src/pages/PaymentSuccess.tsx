import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, ArrowLeft, Receipt, Home } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface VNPayCallbackData {
  amount: number
  bankCode: string
  bankTranNo?: string
  cardType: string
  orderInfo: string
  payDate: string
  responseCode: string
  transactionNo: string
  transactionStatus: string
  txnRef: string
}

export function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [paymentData, setPaymentData] = useState<VNPayCallbackData | null>(null)

  // Parse VNPay callback parameters
  useEffect(() => {
    const vnp_Amount = searchParams.get('vnp_Amount')
    const vnp_BankCode = searchParams.get('vnp_BankCode')
    const vnp_BankTranNo = searchParams.get('vnp_BankTranNo')
    const vnp_CardType = searchParams.get('vnp_CardType')
    const vnp_OrderInfo = searchParams.get('vnp_OrderInfo')
    const vnp_PayDate = searchParams.get('vnp_PayDate')
    const vnp_ResponseCode = searchParams.get('vnp_ResponseCode')
    const vnp_TransactionNo = searchParams.get('vnp_TransactionNo')
    const vnp_TransactionStatus = searchParams.get('vnp_TransactionStatus')
    const vnp_TxnRef = searchParams.get('vnp_TxnRef')

    // Only set payment data if we have the required fields
    if (vnp_BankCode && vnp_CardType && vnp_OrderInfo && vnp_PayDate && 
        vnp_ResponseCode && vnp_TransactionNo && vnp_TransactionStatus && vnp_TxnRef) {
      setPaymentData({
        amount: vnp_Amount ? parseInt(vnp_Amount) / 100 : 0,
        bankCode: vnp_BankCode,
        bankTranNo: vnp_BankTranNo || undefined,
        cardType: vnp_CardType,
        orderInfo: vnp_OrderInfo,
        payDate: vnp_PayDate,
        responseCode: vnp_ResponseCode,
        transactionNo: vnp_TransactionNo,
        transactionStatus: vnp_TransactionStatus,
        txnRef: vnp_TxnRef,
      })
    }
  }, [searchParams])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString.length !== 14) return dateString
    // Format: YYYYMMDDHHmmss -> DD/MM/YYYY HH:mm:ss
    const year = dateString.substring(0, 4)
    const month = dateString.substring(4, 6)
    const day = dateString.substring(6, 8)
    const hour = dateString.substring(8, 10)
    const minute = dateString.substring(10, 12)
    const second = dateString.substring(12, 14)
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`
  }

  const getBankName = (code: string) => {
    const banks: Record<string, string> = {
      'NCB': 'Ngân hàng Quốc Dân (NCB)',
      'VIETCOMBANK': 'Ngân hàng Ngoại Thương (Vietcombank)',
      'VIETINBANK': 'Ngân hàng Công Thương (VietinBank)',
      'BIDV': 'Ngân hàng Đầu Tư và Phát Triển (BIDV)',
      'AGRIBANK': 'Ngân hàng Nông Nghiệp (Agribank)',
      'MB': 'Ngân hàng Quân Đội (MB Bank)',
      'TECHCOMBANK': 'Ngân hàng Kỹ Thương (Techcombank)',
      'ACB': 'Ngân hàng Á Châu (ACB)',
      'VPB': 'Ngân hàng Việt Nam Thịnh Vượng (VPBank)',
      'TPB': 'Ngân hàng Tiên Phong (TPBank)',
      'SACOMBANK': 'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)',
      'HDBANK': 'Ngân hàng Phát triển Nhà TPHCM (HDBank)',
      'VIETCAPITALBANK': 'Ngân hàng Bản Việt (VietCapital Bank)',
      'SCB': 'Ngân hàng TMCP Sài Gòn (SCB)',
      'VIB': 'Ngân hàng Quốc Tế (VIB)',
      'SHB': 'Ngân hàng Sài Gòn - Hà Nội (SHB)',
      'EXIMBANK': 'Ngân hàng Xuất Nhập Khẩu (Eximbank)',
      'MSB': 'Ngân hàng Hàng Hải (MSB)',
      'CAKE': 'CAKE by VPBank',
      'Ubank': 'Ubank by VPBank',
      'TIMO': 'Timo by Ban Viet Bank',
      'VNMART': 'VnMart',
      'VNPAYQR': 'Cổng thanh toán VNPayQR',
      'FOXPAY': 'Ví FoxPay',
      'VIMASS': 'Ví Vimass',
      '1PAY': 'Ví 1Pay',
      'VINID': 'Ví VinID',
      'VIVIET': 'Ví Ví Việt',
      'VNPTPAY': 'Ví VnptPay',
      'YOLO': 'Ví Yolo',
    }
    return banks[code] || code
  }

  const getCardTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'ATM': 'Thẻ ATM nội địa',
      'CREDIT': 'Thẻ tín dụng quốc tế',
      'QRCODE': 'QR Code',
    }
    return types[type] || type
  }

  const getResponseMessage = (code: string) => {
    const messages: Record<string, { message: string; type: 'success' | 'error' | 'warning' }> = {
      '00': { message: 'Giao dịch thành công', type: 'success' },
      '07': { message: 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).', type: 'warning' },
      '09': { message: 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.', type: 'error' },
      '10': { message: 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần', type: 'error' },
      '11': { message: 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.', type: 'error' },
      '12': { message: 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.', type: 'error' },
      '13': { message: 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).', type: 'error' },
      '24': { message: 'Giao dịch không thành công do: Khách hàng hủy giao dịch', type: 'error' },
      '51': { message: 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.', type: 'error' },
      '65': { message: 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.', type: 'error' },
      '75': { message: 'Ngân hàng thanh toán đang bảo trì.', type: 'error' },
      '79': { message: 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.', type: 'error' },
      '99': { message: 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)', type: 'error' },
    }
    return messages[code] || { message: 'Không xác định', type: 'error' }
  }

  if (!paymentData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Đang xử lý kết quả thanh toán...</p>
        </motion.div>
      </div>
    )
  }

  const responseInfo = getResponseMessage(paymentData.responseCode || '99')
  const isSuccess = responseInfo.type === 'success'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Status Icon and Message */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-block"
            >
              {isSuccess ? (
                <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto mb-4" />
              ) : responseInfo.type === 'warning' ? (
                <Clock className="h-24 w-24 text-yellow-500 mx-auto mb-4" />
              ) : (
                <XCircle className="h-24 w-24 text-red-500 mx-auto mb-4" />
              )}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            >
              {isSuccess ? 'Thanh toán thành công!' : responseInfo.type === 'warning' ? 'Giao dịch cần xác minh' : 'Thanh toán thất bại'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`text-lg ${
                isSuccess ? 'text-green-600' : responseInfo.type === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}
            >
              {responseInfo.message}
            </motion.p>
          </div>

          {/* Payment Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="flex items-center space-x-2">
                  <Receipt className="h-6 w-6" />
                  <span>Thông tin giao dịch</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Amount */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Số tiền thanh toán</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(paymentData.amount)}
                  </p>
                </div>

                <Separator />

                {/* Transaction Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mã giao dịch VNPay</p>
                    <p className="font-semibold text-gray-900 dark:text-white font-mono">
                      {paymentData.transactionNo}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mã tham chiếu</p>
                    <p className="font-semibold text-gray-900 dark:text-white font-mono">
                      {paymentData.txnRef}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ngân hàng</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {getBankName(paymentData.bankCode)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loại thẻ</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {getCardTypeLabel(paymentData.cardType)}
                    </p>
                  </div>
                  {paymentData.bankTranNo && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Mã giao dịch ngân hàng</p>
                      <p className="font-semibold text-gray-900 dark:text-white font-mono">
                        {paymentData.bankTranNo}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Thời gian thanh toán</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(paymentData.payDate)}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Order Info */}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Nội dung thanh toán</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {decodeURIComponent(paymentData.orderInfo || '').replace(/\+/g, ' ')}
                  </p>
                </div>

                {/* Status Badge */}
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Trạng thái:</p>
                  <Badge
                    variant={isSuccess ? 'default' : responseInfo.type === 'warning' ? 'secondary' : 'destructive'}
                    className="text-sm"
                  >
                    {isSuccess ? 'Thành công' : responseInfo.type === 'warning' ? 'Cần xác minh' : 'Thất bại'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={() => navigate('/payments')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Quay lại quản lý thanh toán</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <Home className="h-5 w-5" />
              <span>Về trang chủ</span>
            </Button>
          </motion.div>

          {/* Additional Info */}
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                💡 <strong>Lưu ý:</strong> Giao dịch của bạn đã được xử lý thành công. 
                Vui lòng lưu lại thông tin giao dịch để đối chiếu khi cần thiết.
              </p>
            </motion.div>
          )}

          {!isSuccess && responseInfo.type === 'error' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
            >
              <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                ⚠️ <strong>Giao dịch không thành công.</strong> Vui lòng thử lại hoặc liên hệ bộ phận hỗ trợ nếu cần.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

