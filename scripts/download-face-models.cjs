const https = require('https')
const fs = require('fs')
const path = require('path')

// URLs dos modelos do face-api.js
const models = [
  {
    name: 'tiny_face_detector_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json'
  },
  {
    name: 'tiny_face_detector_model-shard1',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1'
  },
  {
    name: 'face_landmark_68_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json'
  },
  {
    name: 'face_landmark_68_model-shard1',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1'
  },
  {
    name: 'face_recognition_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json'
  },
  {
    name: 'face_recognition_model-shard1',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1'
  },
  {
    name: 'face_recognition_model-shard2',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2'
  },
  {
    name: 'face_expression_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json'
  },
  {
    name: 'face_expression_model-shard1',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1'
  }
]

const modelsDir = path.join(__dirname, '..', 'public', 'models')

// Criar diretório se não existir
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true })
}

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(modelsDir, filename)
    
    // Verificar se arquivo já existe
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${filename} já existe`)
      resolve()
      return
    }

    console.log(`Baixando ${filename}...`)
    
    const file = fs.createWriteStream(filePath)
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Erro HTTP: ${response.statusCode} para ${filename}`))
        return
      }
      
      response.pipe(file)
      
      file.on('finish', () => {
        file.close()
        console.log(`✓ ${filename} baixado com sucesso`)
        resolve()
      })
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}) // Delete partial file
        reject(err)
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}

async function downloadAllModels() {
  console.log('Iniciando download dos modelos do face-api.js...')
  console.log(`Diretório de destino: ${modelsDir}`)
  
  try {
    for (const model of models) {
      await downloadFile(model.url, model.name)
    }
    
    console.log('\n✅ Todos os modelos foram baixados com sucesso!')
    console.log('Os modelos estão disponíveis em: public/models/')
    
  } catch (error) {
    console.error('\n❌ Erro ao baixar modelos:', error.message)
    process.exit(1)
  }
}

downloadAllModels()
