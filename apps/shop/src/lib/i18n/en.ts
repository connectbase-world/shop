import type { Translations } from './ko'

const en: Translations = {
  // Common
  common: {
    home: 'Home',
    products: 'Products',
    cart: 'Cart',
    mypage: 'My Page',
    login: 'Login',
    logout: 'Logout',
    search: 'Search',
    all: 'All',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'OK',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    more: 'More',
    won: 'KRW',
    quantity: 'Qty',
    soldOut: 'Sold Out',
    freeShipping: 'Free',
    copy: 'Copy',
    copied: 'Copied!',
  },

  // Header
  header: {
    searchPlaceholder: 'Search products...',
    wishlist: 'Wishlist',
  },

  // Home
  home: {
    featuredProducts: 'Featured Products',
    newArrivals: 'New Arrivals',
    viewAll: 'View All',
    shopByCategory: 'Shop by Category',
    heroDescription: 'Minimal design, comfortable fit. Discover the new season collection.',
    shopNow: 'Shop Now',
  },

  // Categories
  categories: {
    all: 'All',
    tops: 'Tops',
    bottoms: 'Bottoms',
    outerwear: 'Outerwear',
    shoes: 'Shoes',
    accessories: 'Accessories',
  },

  // Product
  product: {
    category: 'Category',
    price: 'Price',
    description: 'Description',
    stock: 'Stock',
    addToCart: 'Add to Cart',
    addedToCart: 'Added to Cart',
    buyNow: 'Buy Now',
    soldOutMessage: 'This item is sold out',
    totalPrice: 'Total Price',
    detailInfo: 'Product Details',
    relatedProducts: 'Related Products',
    sortNewest: 'Newest',
    sortPriceAsc: 'Price: Low to High',
    sortPriceDesc: 'Price: High to Low',
    noProducts: 'No products found',
    itemCount: '{count} items',
    searchResults: 'results',
    clearSearch: 'Clear',
    noSearchResults: 'No results for "{q}"',
    tryDifferentSearch: 'Try a different search term',
    tryDifferentCategory: 'Try selecting a different category',
    recentlyViewed: 'Recently Viewed',
    share: 'Share',
  },

  // Reviews
  review: {
    reviews: 'Reviews',
    writeReview: 'Write a Review',
    noReviews: 'No reviews yet',
    beFirstReview: 'Be the first to write a review!',
    placeholder: 'Share your honest review about this product...',
    submit: 'Submit',
    loginRequired: 'Please log in to write a review.',
    ratingRequired: 'Please select a rating.',
    contentRequired: 'Please enter your review.',
    defaultNickname: 'Member',
    submitFailed: 'Failed to submit review.',
    deleteConfirm: 'Delete this review?',
    deleteFailed: 'Failed to delete.',
    reviewCount: '{count} reviews',
    ratingLabel: 'Rating',
    ratingValue: '{rating}/5',
    addImage: 'Add Image',
  },

  // Cart
  cart: {
    title: 'Cart',
    empty: 'Your cart is empty',
    emptyDescription: 'Add items you like to your cart',
    goShopping: 'Go Shopping',
    removeItem: 'Remove',
    clearAll: 'Clear All',
    subtotal: 'Subtotal',
    shippingFee: 'Shipping',
    total: 'Total',
    checkout: 'Checkout',
    freeShippingNotice: 'Free shipping on orders over {amount}',
    freeShippingRemaining: '{amount} more for free shipping',
  },

  // Wishlist
  wishlist: {
    title: 'Wishlist',
    empty: 'Your wishlist is empty',
    emptyDescription: 'Tap the heart icon to save items you love',
  },

  // Checkout
  checkout: {
    title: 'Checkout',
    orderItems: 'Order Items',
    shippingInfo: 'Shipping Info',
    name: 'Name',
    namePlaceholder: 'John Doe',
    phone: 'Phone',
    phonePlaceholder: '010-1234-5678',
    address: 'Address',
    addressPlaceholder: '123 Main St, Seoul',
    addressDetail: 'Detail Address',
    addressDetailPlaceholder: 'Apt 101',
    deliveryMemo: 'Delivery Note',
    memoPlaceholder: 'Please leave at the door',
    required: 'Required',
    loginNotice: 'Log in to track your order history.',
    fieldRequired: 'Please fill in name, phone, and address.',
    productNotFound: '"{name}" product not found.',
    outOfStock: '"{name}" is sold out.',
    insufficientStock: '"{name}" has insufficient stock. (Available: {stock})',
    paymentProcessing: 'Processing payment...',
    payButton: 'Pay {amount}',
    paymentError: 'An error occurred while processing payment.',
    orderNameMultiple: '{name} and {count} more',

    // Coupons
    coupon: 'Coupon',
    couponCodePlaceholder: 'Enter coupon code',
    apply: 'Apply',
    selectFromMyCoupons: 'Select from My Coupons',
    selectCoupon: 'Select Coupon',
    noCouponsAvailable: 'No coupons available',
    couponNotFound: 'Invalid coupon code.',
    couponInactive: 'This coupon is inactive.',
    couponNotStarted: 'This coupon is not yet available.',
    couponExpired: 'This coupon has expired.',
    couponMinOrder: 'Minimum order of {amount} required.',
    couponAlreadyUsed: 'You have already used this coupon.',
    couponNotApplicable: 'This coupon cannot be applied to this order.',
    couponError: 'Error applying coupon.',
    minOrderRequired: 'Available for orders over {amount}',

    // Mileage
    mileage: 'Mileage',
    availableMileage: 'Available Mileage',
    useMileagePlaceholder: 'Mileage to use',
    useAll: 'Use All',
    mileageUsePending: 'Using {amount}',

    // Payment summary
    paymentSummary: 'Payment Summary',
    itemsTotal: 'Items ({count})',
    shipping: 'Shipping',
    couponDiscount: 'Coupon Discount',
    mileageUse: 'Mileage Used',
    totalPayment: 'Total',
    earnEstimate: 'Estimated mileage: {amount}',
    agreeTerms: 'I confirm the order details and agree to the Terms of Service and Privacy Policy.',
    agreeRequired: 'Please agree to the terms and conditions.',
  },

  // Payment result
  payment: {
    confirming: 'Confirming your payment...',
    success: 'Order Completed',
    orderNumber: 'Order Number',
    successDescription: 'Your order will be shipped as soon as possible.',
    viewOrders: 'View Orders',
    continueShopping: 'Continue Shopping',
    failed: 'Payment Failed',
    failedTitle: 'Payment Failed',
    failedDescription: 'There was a problem processing your payment. Please try again.',
    errorCode: 'Error code: {code}',
    retry: 'Try Again',
    goHome: 'Home',
    goToCart: 'Go to Cart',
    invalidPaymentInfo: 'Invalid payment information.',
    amountMismatch: 'Payment amount mismatch. Tampering detected.',
    orderMismatch: 'Order information mismatch.',
  },

  // Auth
  auth: {
    loginTitle: 'Login',
    loginDescription: 'Sign in with your social account',
    googleLogin: 'Sign in with Google',
    naverLogin: 'Sign in with Naver',
    processing: 'Signing in...',
  },

  // My Page
  mypage: {
    title: 'My Page',
    greeting: 'Hello, {name}',
    loginRequired: 'Login Required',
    loginDescription: 'Please log in to access My Page.',
    loginButton: 'Login',

    // Profile
    myInfo: 'My Info',
    register: 'Register',
    profileNotice: 'Register your shipping info for auto-fill at checkout.',
    saving: 'Saving...',

    // Coupons
    myCoupons: 'My Coupons',
    noCoupons: 'No coupons available',
    available: 'Available',
    used: 'Used',
    expired: 'Expired',

    // Mileage
    mileage: 'Mileage',
    noMileageHistory: 'No mileage history',
    earn: 'Earned',
    spend: 'Spent',
    adjust: 'Adjusted',
    recentOnly: 'Showing recent 10 entries',

    // Influencer
    influencer: 'Influencer',
    influencerDescription: 'Become an influencer and earn commissions through referral links.',
    applyInfluencer: 'Apply as Influencer',
    applying: 'Applying...',
    pendingReview: 'Under Review',
    pendingMessage: 'Your application has been submitted. Please wait for admin approval.',
    rejected: 'Rejected',
    rejectedMessage: 'Your influencer application has been rejected.',
    rejectedReason: 'Reason: {reason}',
    reapply: 'Reapply',
    active: 'Active',
    myReferralLink: 'My Referral Link',
    totalEarned: 'Total Earned',
    unsettled: 'Unsettled',
    settled: 'Settled',
    commissionRate: 'Commission Rate',
    recentCommissions: 'Recent Commissions',
    noCommissions: 'No commissions yet',
    refLinkCommission: 'Referral Link Commission',
    couponCommission: 'Coupon Commission',
    settledStatus: 'Settled',
    pendingStatus: 'Pending',

    // Orders
    orders: 'Orders',
    noOrders: 'No orders yet',
    loadingOrders: 'Loading orders...',
    totalOrders: 'Total Orders',
    shipping: 'Shipping',
    delivered: 'Delivered',
    orderNumber: 'Order No.',
    recipient: 'Recipient',
    phone: 'Phone',
    memo: 'Note',
    cancelOrder: 'Cancel Order',
    cancelling: 'Cancelling...',
    cancelFailed: 'Failed to cancel order.',
    cancelConfirm: 'Are you sure you want to cancel this order?',

    // Return/Exchange
    requestReturn: 'Request Return',
    requestExchange: 'Request Exchange',
    returnReasonLabel: 'Please enter the reason',
    returnReasonPlaceholder: 'Please describe the reason in detail',
    submitReturn: 'Submit',
    submittingReturn: 'Submitting...',
    returnFailed: 'Failed to submit request.',
    returnReason: 'Reason',
  },

  // Order status
  orderStatus: {
    paid: 'Paid',
    preparing: 'Preparing',
    shipped: 'Shipping',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    return_requested: 'Return Requested',
    return_completed: 'Return Completed',
    exchange_requested: 'Exchange Requested',
    exchange_completed: 'Exchange Completed',
  },

  // Coupon claim page
  couponClaim: {
    claiming: 'Verifying coupon...',
    success: 'Coupon claimed!',
    alreadyClaimed: 'You already have this coupon',
    goShopping: 'Go Shopping',
    goToMyCoupons: 'View My Coupons',
    loginRequired: 'Please log in to claim this coupon.',
    loginButton: 'Login to Claim',
  },

  // Boards
  boards: {
    noPosts: 'No posts available',
    views: 'Views',
    pinned: 'Pinned',
    writePost: 'Write',
    loginToWrite: 'Please log in to write a post.',
    postTitle: 'Title',
    postTitlePlaceholder: 'Enter title',
    postContent: 'Content',
    postContentPlaceholder: 'Enter content',
    supported: 'syntax supported',
    submitting: 'Submitting...',
    secretPost: 'Secret',
    secretPostHidden: 'This post is private',
    secretPostBlocked: 'Private Post',
    secretPostBlockedDesc: 'Only the author can view this post.',
  },

  // Pages
  pages: {
    noPages: 'No pages available',
  },

  // Footer
  footer: {
    companyInfo: 'Company: Shop | CEO: John Doe',
    customerService: 'Customer Service',
    businessInfo: 'Business Info',
    copyright: '© 2024 Shop. All rights reserved.',
  },

  // Q&A
  qna: {
    title: 'Product Q&A',
    writeQuestion: 'Ask a Question',
    noQuestions: 'No questions yet',
    beFirstQuestion: 'Be the first to ask!',
    questionPlaceholder: 'Ask a question about this product...',
    submit: 'Submit',
    loginRequired: 'Please log in to ask a question.',
    contentRequired: 'Please enter your question.',
    submitFailed: 'Failed to submit question.',
    deleteConfirm: 'Delete this question?',
    answered: 'Answered',
    waiting: 'Waiting',
    secret: 'Secret',
    secretQuestion: 'Mark as secret',
    answer: 'Answer',
    questionCount: '{count} questions',
  },

  // Promotions
  promotion: {
    title: 'Time Sale',
    ongoing: 'Ongoing',
    ended: 'Ended',
    upcoming: 'Upcoming',
    endsIn: 'Ends in',
    startsIn: 'Starts in',
    days: 'd',
    hours: 'h',
    minutes: 'm',
    seconds: 's',
    viewProducts: 'View Products',
    discountBadge: '{value}% OFF',
    noPromotions: 'No active promotions',
  },

  // 404
  notFound: {
    title: 'Page Not Found',
    description: 'The page you requested does not exist or has been moved.',
    goHome: 'Go to Home',
  },

  // Error
  error: {
    title: 'An error occurred',
    unknown: 'An unknown error occurred.',
    goHome: 'Go to Home',
  },
} as const

export default en
