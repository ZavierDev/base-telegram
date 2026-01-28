// Format number to Rupiah
export function formatRupiah(amount) {
  return `${global.currency} ${amount.toLocaleString('id-ID')}`
}

// Generate random redeem code
export function generateRedeemCode(length = global.redeemCodeLength) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Check if user is owner
export function isOwner(telegramId, db) {
  return db.isOwner(telegramId)
}

// Format date
export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

// Parse expiry time to readable format
export function formatExpiry(timestamp) {
  if (!timestamp) return 'Unlimited'
  
  const now = Date.now()
  const diff = timestamp - now
  
  if (diff <= 0) return 'Expired'
  
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  
  if (days > 0) return `${days} hari`
  if (hours > 0) return `${hours} jam`
  return `${minutes} menit`
}
