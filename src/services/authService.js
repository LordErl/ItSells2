import { supabase } from '../lib/supabase'
import { TABLES, USER_ROLES } from '../lib/constants'

import { ImageUploadService } from './imageUploadService'

export const AuthService = {
  /**
   * Login with CPF and password
   */
  async loginWithCredentials(cpf, password) {
    try {
      console.log('AuthService: Login attempt with CPF:', cpf)

      // Clean CPF
      const cleanCPF = cpf.replace(/\D/g, '')

      // Find user by CPF
      const { data: users, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('cpf', cleanCPF)
        .limit(1)

      if (userError) {
        console.error('AuthService: User query error:', userError)
        throw new Error('Erro ao buscar usuário')
      }

      if (!users || users.length === 0) {
        return {
          success: false,
          error: 'CPF não encontrado'
        }
      }

      const user = users[0]

      // Check if user has password hash
      if (!user.password_hash) {
        return {
          success: false,
          error: 'Usuário não possui senha. Use reconhecimento facial.'
        }
      }

      // Verify password (simplified - in production use proper hashing)
      const isValidPassword = user.password_hash === password

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Senha incorreta'
        }
      }

      // Generate session token
      const token = this.generateToken(user.id)

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            cpf: user.cpf,
            role: user.role,
            photo_url: user.photo_url
          },
          token
        }
      }

    } catch (error) {
      console.error('AuthService: Login error:', error)
      return {
        success: false,
        error: error.message || 'Erro no login'
      }
    }
  },

  /**
   * Login with face recognition
   */
  async loginWithFace(faceData) {
    try {
      console.log('AuthService: Face login attempt')

      // Simulate face recognition (replace with actual face recognition logic)
      const { data: users, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .not('photo_url', 'is', null)
        .not('face_data', 'is', null)

      if (userError) {
        console.error('AuthService: Face login query error:', userError)
        throw new Error('Erro na busca por reconhecimento facial')
      }

      if (!users || users.length === 0) {
        return {
          success: false,
          error: 'Nenhum usuário com dados faciais encontrado'
        }
      }

      // For now, return the first user with face data (implement actual face matching)
      const user = users[0]

      // Generate session token
      const token = this.generateToken(user.id)

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            cpf: user.cpf,
            role: user.role,
            photo_url: user.photo_url
          },
          token
        }
      }

    } catch (error) {
      console.error('AuthService: Face login error:', error)
      return {
        success: false,
        error: error.message || 'Erro no reconhecimento facial'
      }
    }
  },

  /**
   * Register customer with photo
   */
  async registerWithPhoto(userData, photoFile) {
    try {
      console.log('AuthService: Starting registration with photo...', {
        userData,
        hasPhoto: !!photoFile
      })

      // Validate required fields
      if (!userData.cpf || !userData.name) {
        throw new Error('CPF e nome são obrigatórios')
      }
      
      // Validate photo is provided
      if (!photoFile) {
        throw new Error('A foto é obrigatória para o cadastro')
      }

      // Clean CPF
      const cleanCPF = userData.cpf.replace(/\D/g, '')

      // Check if CPF already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('cpf', cleanCPF)
        .limit(1)

      if (checkError) {
        console.error('AuthService: CPF check error:', checkError)
        throw new Error('Erro ao verificar CPF')
      }

      // If user already exists, handle login flow instead
      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        console.log('AuthService: User already exists, handling as login:', existingUser.id);
        
        // Generate session token
        const token = this.generateToken(existingUser.id);
        
        // Get customer account
        const { data: customerAccount } = await supabase
          .from(TABLES.CUSTOMER_ACCOUNTS)
          .select('*')
          .eq('user_id', existingUser.id)
          .single();
        
        return {
          success: true,
          data: {
            user: {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              cpf: existingUser.cpf,
              role: existingUser.role,
              photo_url: existingUser.photo_url,
              photo_path: existingUser.photo_path
            },
            customerAccount,
            token,
            isExistingUser: true
          }
        };
      }

      // Upload photo (mandatory)
      let photoUrl = null
      let photoPath = null
      let faceData = null

      console.log('AuthService: Uploading photo...', { photoFile })
      
      if (!photoFile) {
        console.error('AuthService: Photo file is missing')
        throw new Error('A foto é obrigatória para o cadastro')
      }
      
      const uploadResult = await ImageUploadService.uploadImage(photoFile, null, true)
      
      console.log('AuthService: Photo upload result:', uploadResult)

      if (uploadResult.success) {
        photoUrl = uploadResult.data.url
        photoPath = uploadResult.data.path
        
        // Generate face data for recognition (simplified)
        faceData = {
          uploaded_at: new Date().toISOString(),
          file_name: uploadResult.data.fileName,
          file_size: uploadResult.data.size
        }
        
        console.log('AuthService: Photo uploaded successfully:', {
          photoUrl,
          photoPath,
          faceData
        })
      } else {
        console.error('AuthService: Photo upload failed:', uploadResult.error)
        throw new Error(`Erro no upload da foto: ${uploadResult.error}`)
      }

      // Prepare user data
      const userInsertData = {
        cpf: cleanCPF,
        name: userData.name.trim(),
        role: USER_ROLES.CUSTOMER,
        photo_url: photoUrl,
        photo_path: photoPath,
        face_data: faceData
      }

      // Add optional fields
      if (userData.email && userData.email.trim()) {
        userInsertData.email = userData.email.trim()
      }

      if (userData.password && userData.password.trim()) {
        userInsertData.password_hash = userData.password.trim() // In production, hash this
      }

      console.log('AuthService: Inserting user data:', userInsertData)

      // Insert user
      const { data: newUser, error: userInsertError } = await supabase
        .from(TABLES.USERS)
        .insert([userInsertData])
        .select()
        .single()

      if (userInsertError) {
        console.error('AuthService: User insert error:', userInsertError)
        
        // If user creation failed and photo was uploaded, clean up
        if (photoPath) {
          console.log('AuthService: Cleaning up uploaded photo due to user creation failure')
          await ImageUploadService.deleteImage(photoPath)
        }
        
        throw new Error('Erro ao criar usuário')
      }

      console.log('AuthService: User created successfully:', newUser)

      // Create customer account
      const customerData = {
        user_id: newUser.id,
        account_balance: 0,
        loyalty_points: 0,
        preferences: {}
      }

      console.log('AuthService: Creating customer account:', customerData)

      const { data: customerAccount, error: customerError } = await supabase
        .from(TABLES.CUSTOMER_ACCOUNTS)
        .insert([customerData])
        .select()
        .single()

      if (customerError) {
        console.error('AuthService: Customer account creation error:', customerError)
        
        // Clean up user and photo if customer account creation fails
        await supabase.from(TABLES.USERS).delete().eq('id', newUser.id)
        
        if (photoPath) {
          await ImageUploadService.deleteImage(photoPath)
        }
        
        throw new Error('Erro ao criar conta do cliente')
      }

      console.log('AuthService: Customer account created successfully:', customerAccount)

      // Generate session token
      const token = this.generateToken(newUser.id)

      const result = {
        success: true,
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            cpf: newUser.cpf,
            role: newUser.role,
            photo_url: newUser.photo_url,
            photo_path: newUser.photo_path
          },
          customerAccount,
          token
        }
      }

      console.log('AuthService: Registration completed successfully:', result)
      return result

    } catch (error) {
      console.error('AuthService: Registration error:', error)
      return {
        success: false,
        error: error.message || 'Erro no cadastro'
      }
    }
  },

  /**
   * Register customer (legacy - without photo)
   */
  async registerCustomer(userData) {
    return await this.registerWithPhoto(userData, null)
  },

  /**
   * Verify token
   */
  async verifyToken(token) {
    try {
      // Simple token verification (implement proper JWT verification in production)
      const parts = token.split('.')
      if (parts.length !== 3) return false

      const payload = JSON.parse(atob(parts[1]))
      const now = Date.now() / 1000

      return payload.exp > now
    } catch (error) {
      console.error('AuthService: Token verification error:', error)
      return false
    }
  },

  /**
   * Logout
   */
  async logout() {
    try {
      // Clear any server-side session if needed
      console.log('AuthService: Logging out user')
      return { success: true }
    } catch (error) {
      console.error('AuthService: Logout error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Generate session token
   */
  generateToken(userId) {
    // Simple token generation (use proper JWT in production)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({
      userId,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }))
    const signature = btoa(`signature_${userId}_${Date.now()}`)

    return `${header}.${payload}.${signature}`
  }
}

