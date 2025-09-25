const NAMESPACE = 'conchas-abanico'

export class MockDB {
  static getKey(collection) {
    return `${NAMESPACE}:${collection}`
  }
  
  static get(collection) {
    try {
      const key = this.getKey(collection)
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return []
    }
  }
  
  static set(collection, data) {
    try {
      const key = this.getKey(collection)
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Error writing to localStorage:', error)
      return false
    }
  }
  
  static add(collection, item) {
    console.log('🔍 [MockDB] add: Adding item to collection:', collection)
    console.log('🔍 [MockDB] add: Item to add:', item)
    console.log('🔍 [MockDB] add: Using key:', this.getKey(collection))
    
    const items = this.get(collection)
    console.log('🔍 [MockDB] add: Current items count:', items.length)
    
    items.push(item)
    console.log('🔍 [MockDB] add: Items count after push:', items.length)
    
    const result = this.set(collection, items)
    console.log('🔍 [MockDB] add: Set result:', result)
    
    // Also add to mock_users for backward compatibility
    if (collection === 'users') {
      console.log('🔍 [MockDB] add: Also adding to mock_users for backward compatibility')
      const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]')
      mockUsers.push(item)
      localStorage.setItem('mock_users', JSON.stringify(mockUsers))
      console.log('🔍 [MockDB] add: mock_users updated, count:', mockUsers.length)
    }
    
    return result
  }
  
  static update(collection, id, updatedItem) {
    const items = this.get(collection)
    const index = items.findIndex(item => item.id === id)
    
    if (index !== -1) {
      items[index] = { ...items[index], ...updatedItem, updatedAt: new Date().toISOString() }
      return this.set(collection, items)
    }
    
    return false
  }
  
  static delete(collection, id) {
    const items = this.get(collection)
    const filtered = items.filter(item => item.id !== id)
    return this.set(collection, filtered)
  }
  
  static findById(collection, id) {
    const items = this.get(collection)
    return items.find(item => item.id === id) || null
  }
  
  static findBy(collection, criteria) {
    const items = this.get(collection)
    return items.filter(item => {
      return Object.keys(criteria).every(key => item[key] === criteria[key])
    })
  }
  
  static clear(collection) {
    const key = this.getKey(collection)
    localStorage.removeItem(key)
  }
  
  static clearAll() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(NAMESPACE))
    keys.forEach(key => localStorage.removeItem(key))
  }
  
  static getSeedVersion() {
    return localStorage.getItem(`${NAMESPACE}:seedVersion`) || null
  }
  
  static setSeedVersion(version) {
    localStorage.setItem(`${NAMESPACE}:seedVersion`, version)
  }
}