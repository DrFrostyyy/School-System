import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.edu' },
    update: {},
    create: {
      email: 'admin@school.edu',
      password: adminPassword,
      role: 'ADMIN'
    }
  })

  console.log('✅ Admin user created:', admin.email)

  // Create sample teacher users
  const teacher1Password = await bcrypt.hash('teacher123', 10)
  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher1@school.edu' },
    update: {},
    create: {
      email: 'teacher1@school.edu',
      password: teacher1Password,
      role: 'TEACHER',
      teacherProfile: {
        create: {
          name: 'Dr. John Smith',
          department: 'Mathematics',
          position: 'Senior Lecturer',
          phone: '+1 234-567-8900',
          status: 'ACTIVE'
        }
      }
    }
  })

  const teacher2Password = await bcrypt.hash('teacher123', 10)
  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@school.edu' },
    update: {},
    create: {
      email: 'teacher2@school.edu',
      password: teacher2Password,
      role: 'TEACHER',
      teacherProfile: {
        create: {
          name: 'Prof. Jane Johnson',
          department: 'English',
          position: 'Associate Professor',
          phone: '+1 234-567-8901',
          status: 'ACTIVE'
        }
      }
    }
  })

  console.log('✅ Sample teachers created')

  console.log('🎉 Seeding completed!')
  console.log('\nDefault credentials:')
  console.log('Admin: admin@school.edu / admin123')
  console.log('Teacher 1: teacher1@school.edu / teacher123')
  console.log('Teacher 2: teacher2@school.edu / teacher123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

