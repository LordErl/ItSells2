import { supabase, TABLES, USER_ROLES, dbHelpers } from '../lib/supabase'
import { ImageUploadService } from './imageUploadService'

export const AuthService = {

  // Login with CPF and password
  static async loginWithCredentials(cpf, password) {
    try {
      // First, get user by CPF
      const { data: userData, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('cpf', cpf)
        .single()

      if (userError || !userData) {
        throw new Error('CPF não encontrado')
      }

      // For demo purposes, we'll use a simple password check
      // In production, use proper password hashing
      if (userData.password !== password) {
        throw new Error('Senha incorreta')
      }

      // Create session token (in production, use proper JWT)
      const sessionToken = await this.createSession(userData)

      // Remove password from response
      const { password: _, ...userWithoutPassword } = userData

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          token: sessionToken
        }
      }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Login with face recognition
  static async loginWithFace(faceData) {
    try {
      // Get face data from database for comparison
      const { data: faceRecords, error: faceError } = await supabase
        .from(TABLES.FACE_DATA)
        .select(`
          *,
          users (*)
        `)

      if (faceError) {
        throw new Error('Erro ao acessar dados de reconhecimento facial')
      }

      // In a real implementation, you would compare the faceData
      // with stored face encodings using a face recognition library
      const matchedFace = await this.compareFaceData(faceData, faceRecords)

      if (!matchedFace) {
        throw new Error('Rosto não reconhecido')
      }

      const user = matchedFace.users
      const sessionToken = await this.createSession(user)

      return {
        success: true,
        data: {
          user,
          token: sessionToken
        }
      }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Register new customer
  static async registerCustomer(customerData) {
    try {
      const { cpf, name, photo } = customerData

      // Check if CPF already exists
      const { data: existingUser } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .eq('cpf', cpf)
        .single()

      if (existingUser) {
        throw new Error('CPF já cadastrado')
      }

      // Validate CPF (basic validation)
      if (!this.validateCPF(cpf)) {
        throw new Error('CPF inválido')
      }

      // Create new user
      const newUser = {
        cpf,
        name,
        role: USER_ROLES.CUSTOMER,
        photo,
        created_at: new Date().toISOString(),
        active: true
      }

      const { data: userData, error: userError } = await supabase
        .from(TABLES.USERS)
        .insert([newUser])
        .select()
        .single()

      if (userError) {
        throw userError
      }

      // Store face data if photo is provided
      if (photo) {
        await this.storeFaceData(userData.id, photo)
      }

      // Create customer account
      await this.createCustomerAccount(userData.id)

      const sessionToken = await this.createSession(userData)

      return {
        success: true,
        data: {
          user: userData,
          token: sessionToken
        }
      }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Verify session token
  static async verifyToken(token) {
    try {
      // In production, verify JWT token properly
      if (!token || !token.startsWith('session_')) {
        return false
      }

      const userId = token.split('_')[1]
      
      const { data: user, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .eq('active', true)
        .single()

      return !error && user
    } catch (error) {
      return false
    }
  }

  // Get user by ID
  static async getUserById(userId) {
    try {
      const { data: user, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        throw error
      }

      return { success: true, data: user }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Update user data
  static async updateUser(userId, updates) {
    try {
      const { data: user, error } = await supabase
        .from(TABLES.USERS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return { success: true, data: user }
    } catch (error) {
      return {
        success: false,
        error: dbHelpers.handleError(error)
      }
    }
  }

  // Create session token (simplified for demo)
  static async createSession(user) {
    // In production, create proper JWT token
    return `session_${user.id}_${Date.now()}`
  }

  // Store face data for recognition
  static async storeFaceData(userId, photoData) {
    try {
      // In production, extract face encodings from photo
      const faceEncoding = await this.extractFaceEncoding(photoData)

      const { error } = await supabase
        .from(TABLES.FACE_DATA)
        .insert([{
          user_id: userId,
          face_encoding: faceEncoding,
          photo_url: photoData,
          created_at: new Date().toISOString()
        }])

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error storing face data:', error)
      return false
    }
  }

  // Create customer account
  static async createCustomerAccount(userId) {
    try {
      const { error } = await supabase
        .from(TABLES.CUSTOMER_ACCOUNTS)
        .insert([{
          user_id: userId,
          current_bill: 0,
          total_spent: 0,
          visit_count: 0,
          created_at: new Date().toISOString()
        }])

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error creating customer account:', error)
      return false
    }
  }

  // Compare face data (mock implementation)
  static async compareFaceData(inputFaceData, storedFaceRecords) {
    // In production, use a proper face recognition library
    // like face-api.js or a cloud service
    
    // Mock implementation - randomly match for demo
    if (storedFaceRecords && storedFaceRecords.length > 0) {
      return storedFaceRecords[0] // Return first match for demo
    }
    
    return null
  }

  // Extract face encoding (mock implementation)
  static async extractFaceEncoding(photoData) {
    // In production, use face-api.js or similar library
    // to extract face descriptors/encodings
    return `face_encoding_${Date.now()}`
  }

  // Validate CPF (Brazilian tax ID)
  static validateCPF(cpf) {
    // Remove non-numeric characters
    cpf = cpf.replace(/[^\d]/g, '')
    
    // Check if CPF has 11 digits
    if (cpf.length !== 11) return false
    
    // Check if all digits are the same
    if (/^(\d)\1{10}$/.test(cpf)) return false
    
    // Validate CPF algorithm
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i)
    }
    
    let remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cpf.charAt(9))) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i)
    }
    
    remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cpf.charAt(10))) return false
    
    return true
  }

  // Logout (clear session)
  static async logout() {
    // In production, invalidate the session token on the server
    return { success: true }
  }
  static async registerWithPhoto(userData, photoFile) {
    try {
      // Criar usuário primeiro
      const { data: user, error: userError } = await supabase.auth.signUp({
        email: `${userData.cpf}@itsells.temp`, // Email temporário
        password: userData.cpf, // Senha temporária
        options: {
          data: {
            name: userData.name,
            cpf: userData.cpf,
            role: 'customer'
          }
        }
      })

      if (userError) throw userError

      // Upload da foto se fornecida
      let photoData = null
      if (photoFile && user.user) {
        photoData = await ImageUploadService.processAndUploadPhoto(
          photoFile, 
          user.user.id, 
          'profile'
        )
      }

      // Salvar dados do usuário na tabela users
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.user.id,
          email: user.user.email,
          name: userData.name,
          cpf: userData.cpf,
          role: 'customer',
          photo_url: photoData?.url || null,
          photo_path: photoData?.path || null
        })

      if (insertError) throw insertError

      return user
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }
}

