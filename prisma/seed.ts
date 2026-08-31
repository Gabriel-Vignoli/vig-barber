import { PrismaClient, Role, Weekday } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Limpando banco de dados...")
  await prisma.review.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.employeeSchedule.deleteMany()
  await prisma.employeeService.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.barbershopService.deleteMany()
  await prisma.barbershop.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  console.log("Criando barbearia...")
  const barbershop = await prisma.barbershop.create({
    data: {
      name: "Vig Barber",
      address: "Avenida São Sebastião, 357, São Paulo",
      phones: ["(11) 98204-5108", "(11) 99503-2351"],
      description:
        "Bem-vindo à Vig Barber, onde tradição encontra estilo. Nossa equipe de mestres barbeiros transforma cortes de cabelo e barbas em obras de arte. Em um ambiente acolhedor, promovemos confiança, estilo e uma comunidade unida.",
      imageUrl:
        "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80",
    },
  })

  console.log("Criando serviços...")
  const services = await Promise.all([
    prisma.barbershopService.create({
      data: {
        barbershopId: barbershop.id,
        name: "Corte de Cabelo",
        description: "Estilo personalizado com as últimas tendências.",
        price: 50.0,
        durationInMinutes: 30,
        imageUrl:
          "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80",
      },
    }),
    prisma.barbershopService.create({
      data: {
        barbershopId: barbershop.id,
        name: "Barba",
        description: "Modelagem completa para destacar sua masculinidade.",
        price: 45.0,
        durationInMinutes: 25,
        imageUrl:
          "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80",
      },
    }),
    prisma.barbershopService.create({
      data: {
        barbershopId: barbershop.id,
        name: "Sobrancelha",
        description: "Expressão acentuada com modelagem precisa.",
        price: 25.0,
        durationInMinutes: 15,
        imageUrl:
          "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80",
      },
    }),
    prisma.barbershopService.create({
      data: {
        barbershopId: barbershop.id,
        name: "Pézinho",
        description: "Acabamento perfeito para um visual renovado.",
        price: 20.0,
        durationInMinutes: 15,
        imageUrl:
          "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80",
      },
    }),
    prisma.barbershopService.create({
      data: {
        barbershopId: barbershop.id,
        name: "Hidratação",
        description: "Fios hidratados, macios e brilhantes.",
        price: 30.0,
        durationInMinutes: 20,
        imageUrl:
          "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80",
      },
    }),
    prisma.barbershopService.create({
      data: {
        barbershopId: barbershop.id,
        name: "Massagem",
        description: "Relaxe e renove com nossos tratamentos revitalizantes.",
        price: 35.0,
        durationInMinutes: 20,
        imageUrl:
          "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=80",
      },
    }),
  ])

  const [
    corteService,
    barbaService,
    sobrancelhaService,
    pezinhoService,
    hidratacaoService,
    massagemService,
  ] = services

  console.log("Criando funcionários...")

  const employeesData = [
    {
      name: "Miguel Silva Menezes",
      email: "miguel@vigbarber.com",
      imageUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
      bio: "Especialista em cortes clássicos e modernos, com mais de 8 anos de experiência.",
      services: [corteService, pezinhoService, hidratacaoService],
    },
    {
      name: "Rafael Costa",
      email: "rafael@vigbarber.com",
      imageUrl:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80",
      bio: "Mestre em barba e acabamentos, focado em técnicas de navalha.",
      services: [barbaService, sobrancelhaService, pezinhoService],
    },
    {
      name: "Lucas Almeida",
      email: "lucas@vigbarber.com",
      imageUrl:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
      bio: "Apaixonado por tendências, especializado em cortes degradê e design.",
      services: [corteService, barbaService, massagemService],
    },
  ]

  const employees = []

  for (const data of employeesData) {
    const hashedPassword = await hash("senha123", 10)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        image: data.imageUrl,
        role: Role.EMPLOYEE,
      },
    })

    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        bio: data.bio,
        imageUrl: data.imageUrl,
      },
    })

    await prisma.employeeService.createMany({
      data: data.services.map((service) => ({
        employeeId: employee.id,
        serviceId: service.id,
      })),
    })

    // Working hours: Tue-Fri 09:00-21:00, Sat 08:00-17:00, Sun/Mon off
    await prisma.employeeSchedule.createMany({
      data: [
        {
          employeeId: employee.id,
          weekday: Weekday.MONDAY,
          startTime: "00:00",
          endTime: "00:00",
          isDayOff: true,
        },
        {
          employeeId: employee.id,
          weekday: Weekday.TUESDAY,
          startTime: "09:00",
          endTime: "21:00",
          isDayOff: false,
        },
        {
          employeeId: employee.id,
          weekday: Weekday.WEDNESDAY,
          startTime: "09:00",
          endTime: "21:00",
          isDayOff: false,
        },
        {
          employeeId: employee.id,
          weekday: Weekday.THURSDAY,
          startTime: "09:00",
          endTime: "21:00",
          isDayOff: false,
        },
        {
          employeeId: employee.id,
          weekday: Weekday.FRIDAY,
          startTime: "09:00",
          endTime: "21:00",
          isDayOff: false,
        },
        {
          employeeId: employee.id,
          weekday: Weekday.SATURDAY,
          startTime: "08:00",
          endTime: "17:00",
          isDayOff: false,
        },
        {
          employeeId: employee.id,
          weekday: Weekday.SUNDAY,
          startTime: "00:00",
          endTime: "00:00",
          isDayOff: true,
        },
      ],
    })

    employees.push(employee)
  }

  console.log("Criando cliente de teste...")
  const clientPassword = await hash("senha123", 10)
  await prisma.user.create({
    data: {
      name: "João Cliente",
      email: "cliente@example.com",
      password: clientPassword,
      role: Role.CLIENT,
    },
  })

  console.log("Criando admin de teste...")
  const adminPassword = await hash("senha123", 10)
  await prisma.user.create({
    data: {
      name: "Gabriel Vignoli",
      email: "admin@vigbarber.com",
      password: adminPassword,
      role: Role.ADMIN,
    },
  })

  console.log("Seed concluído com sucesso!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
