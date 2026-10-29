import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { hash } from "bcryptjs"
import {
  BookingStatus,
  ExpenseCategory,
  MemberRole,
  PaymentMethod,
  Plan,
  PrismaClient,
  Role,
  SubscriptionStatus,
  Weekday,
} from "../app/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const DEFAULT_PASSWORD = "senha123"

// Business runs on America/Sao_Paulo (fixed UTC-3)
const BRAZIL_OFFSET_HOURS = 3

// Returns a Date at the given Brazil wall-clock time, `daysFromToday` days away.
// Sundays and Mondays (days off) are pushed to the following Tuesday.
const brazilDate = (daysFromToday: number, hour: number, minute = 0) => {
  const nowInBrazil = new Date(Date.now() - BRAZIL_OFFSET_HOURS * 3600 * 1000)
  const day = new Date(
    Date.UTC(
      nowInBrazil.getUTCFullYear(),
      nowInBrazil.getUTCMonth(),
      nowInBrazil.getUTCDate() + daysFromToday,
    ),
  )
  const weekday = day.getUTCDay()
  if (weekday === 0) day.setUTCDate(day.getUTCDate() + 2)
  if (weekday === 1) day.setUTCDate(day.getUTCDate() + 1)

  return new Date(
    Date.UTC(
      day.getUTCFullYear(),
      day.getUTCMonth(),
      day.getUTCDate(),
      hour + BRAZIL_OFFSET_HOURS,
      minute,
    ),
  )
}

// Working hours: Tue-Fri 09:00-21:00, Sat 08:00-17:00, Sun/Mon off
const DEFAULT_SCHEDULE = [
  {
    weekday: Weekday.SUNDAY,
    startTime: "00:00",
    endTime: "00:00",
    isDayOff: true,
  },
  {
    weekday: Weekday.MONDAY,
    startTime: "00:00",
    endTime: "00:00",
    isDayOff: true,
  },
  {
    weekday: Weekday.TUESDAY,
    startTime: "09:00",
    endTime: "21:00",
    isDayOff: false,
  },
  {
    weekday: Weekday.WEDNESDAY,
    startTime: "09:00",
    endTime: "21:00",
    isDayOff: false,
  },
  {
    weekday: Weekday.THURSDAY,
    startTime: "09:00",
    endTime: "21:00",
    isDayOff: false,
  },
  {
    weekday: Weekday.FRIDAY,
    startTime: "09:00",
    endTime: "21:00",
    isDayOff: false,
  },
  {
    weekday: Weekday.SATURDAY,
    startTime: "08:00",
    endTime: "17:00",
    isDayOff: false,
  },
]

interface ServiceSeed {
  name: string
  description: string
  price: number
  durationInMinutes: number
  imageUrl: string
}

const createServices = async (barbershopId: string, data: ServiceSeed[]) => {
  const services = []
  for (const service of data) {
    services.push(
      await prisma.barbershopService.create({
        data: { ...service, barbershopId },
      }),
    )
  }
  return services
}

interface UserSeed {
  name: string
  email: string
  role: Role
  image?: string
  phone?: string
  isPlatformAdmin?: boolean
}

const createUser = async (data: UserSeed) => {
  const password = await hash(DEFAULT_PASSWORD, 10)
  return prisma.user.create({ data: { ...data, password } })
}

// Creates the Employee profile in a shop, its service links and weekly schedule
const createEmployee = async ({
  userId,
  barbershopId,
  bio,
  imageUrl,
  phone,
  serviceIds,
}: {
  userId: string
  barbershopId: string
  bio: string
  imageUrl: string
  phone?: string
  serviceIds: string[]
}) => {
  const employee = await prisma.employee.create({
    data: { userId, barbershopId, bio, imageUrl, phone },
  })

  await prisma.employeeService.createMany({
    data: serviceIds.map((serviceId) => ({
      employeeId: employee.id,
      serviceId,
    })),
  })

  await prisma.employeeSchedule.createMany({
    data: DEFAULT_SCHEDULE.map((day) => ({ ...day, employeeId: employee.id })),
  })

  return employee
}

const addMember = (userId: string, barbershopId: string, role: MemberRole) =>
  prisma.membership.create({ data: { userId, barbershopId, role } })

const IMAGES = {
  corte:
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80",
  barba:
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80",
  pezinho:
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80",
  hidratacao:
    "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80",
  massagem:
    "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=80",
}

const AVATARS = {
  miguel:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
  rafael:
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80",
  lucas:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
  ricardo:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  thiago:
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
  bruno:
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80",
  diego:
    "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80",
}

async function main() {
  console.log("Limpando banco de dados...")
  await prisma.review.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.invitation.deleteMany()
  await prisma.membership.deleteMany()
  await prisma.employeeSchedule.deleteMany()
  await prisma.employeeService.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.barbershopService.deleteMany()
  await prisma.barbershop.deleteMany()
  await prisma.passwordResetCode.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  // Created first on purpose: the app still reads the shop with findFirst()
  // until the tenant routes land (Phase 3/4a)
  console.log("Criando barbearias...")
  const centro = await prisma.barbershop.create({
    data: {
      slug: "vig-barber-centro",
      name: "Vig Barber Centro",
      address: "Rua Augusta, 1450 - Consolação, São Paulo - SP, 01304-001",
      city: "São Paulo",
      latitude: -23.5568,
      longitude: -46.6608,
      phones: ["(11) 98204-5108", "(11) 99503-2351"],
      description:
        "Bem-vindo à Vig Barber, onde tradição encontra estilo. Nossa equipe de mestres barbeiros transforma cortes de cabelo e barbas em obras de arte. Em um ambiente acolhedor, promovemos confiança, estilo e uma comunidade unida.",
      bannerUrl:
        "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80",
      instagramUrl: "https://instagram.com/vigbarber",
      plan: Plan.PRO,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
  })

  const navalha = await prisma.barbershop.create({
    data: {
      slug: "navalha-de-ouro",
      name: "Navalha de Ouro",
      address: "Rua dos Pinheiros, 820 - Pinheiros, São Paulo - SP, 05422-001",
      city: "São Paulo",
      latitude: -23.5662,
      longitude: -46.6838,
      phones: ["(11) 97412-3380"],
      description:
        "Barbearia clássica no coração de Pinheiros. Toalha quente, navalha afiada e um café passado na hora enquanto você espera.",
      bannerUrl:
        "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80",
      instagramUrl: "https://instagram.com/navalhadeouro",
      plan: Plan.BASIC,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
  })

  const barbaNegra = await prisma.barbershop.create({
    data: {
      slug: "barba-negra",
      name: "Barba Negra",
      address: "Rua Tuiuti, 1200 - Tatuapé, São Paulo - SP, 03081-000",
      city: "São Paulo",
      latitude: -23.5401,
      longitude: -46.5768,
      phones: ["(11) 96655-2041", "(11) 2295-7710"],
      description:
        "Especialistas em degradê e barba completa na Zona Leste. Ambiente descontraído, boa música e atendimento sem pressa.",
      bannerUrl:
        "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1200&q=80",
      plan: Plan.TRIAL,
      subscriptionStatus: SubscriptionStatus.TRIALING,
      trialEndsAt: brazilDate(14, 23, 59),
    },
  })

  console.log("Criando serviços...")
  const [
    centroCorte,
    centroBarba,
    centroSobrancelha,
    centroPezinho,
    centroHidratacao,
    centroMassagem,
  ] = await createServices(centro.id, [
    {
      name: "Corte de Cabelo",
      description: "Estilo personalizado com as últimas tendências.",
      price: 50,
      durationInMinutes: 30,
      imageUrl: IMAGES.corte,
    },
    {
      name: "Barba",
      description: "Modelagem completa para destacar sua masculinidade.",
      price: 45,
      durationInMinutes: 25,
      imageUrl: IMAGES.barba,
    },
    {
      name: "Sobrancelha",
      description: "Expressão acentuada com modelagem precisa.",
      price: 25,
      durationInMinutes: 15,
      imageUrl: IMAGES.barba,
    },
    {
      name: "Pézinho",
      description: "Acabamento perfeito para um visual renovado.",
      price: 20,
      durationInMinutes: 15,
      imageUrl: IMAGES.pezinho,
    },
    {
      name: "Hidratação",
      description: "Fios hidratados, macios e brilhantes.",
      price: 30,
      durationInMinutes: 20,
      imageUrl: IMAGES.hidratacao,
    },
    {
      name: "Massagem",
      description: "Relaxe e renove com nossos tratamentos revitalizantes.",
      price: 35,
      durationInMinutes: 20,
      imageUrl: IMAGES.massagem,
    },
  ])

  const [navalhaCorte, navalhaBarba, navalhaCombo, navalhaPigmentacao] =
    await createServices(navalha.id, [
      {
        name: "Corte Clássico",
        description: "Corte na tesoura e máquina, finalizado com pomada.",
        price: 60,
        durationInMinutes: 40,
        imageUrl: IMAGES.corte,
      },
      {
        name: "Barba na Navalha",
        description: "Toalha quente, navalha e balm hidratante.",
        price: 50,
        durationInMinutes: 30,
        imageUrl: IMAGES.barba,
      },
      {
        name: "Corte + Barba",
        description: "O combo completo da casa com desconto.",
        price: 95,
        durationInMinutes: 60,
        imageUrl: IMAGES.corte,
      },
      {
        name: "Pigmentação de Barba",
        description: "Preenchimento de falhas com acabamento natural.",
        price: 40,
        durationInMinutes: 30,
        imageUrl: IMAGES.barba,
      },
    ])

  const [negraDegrade, negraBarba, negraSobrancelha, negraRelaxamento] =
    await createServices(barbaNegra.id, [
      {
        name: "Corte Degradê",
        description: "Degradê navalhado com desenho opcional.",
        price: 45,
        durationInMinutes: 40,
        imageUrl: IMAGES.corte,
      },
      {
        name: "Barba Completa",
        description: "Alinhamento, toalha quente e óleo para barba.",
        price: 40,
        durationInMinutes: 30,
        imageUrl: IMAGES.barba,
      },
      {
        name: "Sobrancelha",
        description: "Limpeza e alinhamento na navalha.",
        price: 20,
        durationInMinutes: 15,
        imageUrl: IMAGES.pezinho,
      },
      {
        name: "Relaxamento Capilar",
        description: "Reduz o volume e facilita a finalização.",
        price: 70,
        durationInMinutes: 45,
        imageUrl: IMAGES.hidratacao,
      },
    ])

  console.log("Criando admin da plataforma...")
  // Global role ADMIN kept until Phase 4c so the current admin panel still works
  await createUser({
    name: "Gabriel Vignoli",
    email: "admin@vigbarber.com",
    role: Role.ADMIN,
    isPlatformAdmin: true,
  })

  console.log("Criando donos das barbearias...")
  const ricardo = await createUser({
    name: "Ricardo Mendes",
    email: "ricardo@vigbarber.com",
    role: Role.ADMIN,
    image: AVATARS.ricardo,
    phone: "(11) 98877-1020",
  })
  const fernando = await createUser({
    name: "Fernando Rocha",
    email: "fernando@navalhadeouro.com",
    role: Role.ADMIN,
    phone: "(11) 97412-3380",
  })
  const andre = await createUser({
    name: "André Barbosa",
    email: "andre@barbanegra.com",
    role: Role.ADMIN,
    phone: "(11) 96655-2041",
  })

  await addMember(ricardo.id, centro.id, MemberRole.ADMIN)
  await addMember(fernando.id, navalha.id, MemberRole.ADMIN)
  await addMember(andre.id, barbaNegra.id, MemberRole.ADMIN)

  console.log("Criando funcionários...")
  // Ricardo owns Vig Barber Centro and also cuts hair there
  const ricardoEmployee = await createEmployee({
    userId: ricardo.id,
    barbershopId: centro.id,
    bio: "Fundador da Vig Barber, 15 anos de tesoura e navalha.",
    imageUrl: AVATARS.ricardo,
    serviceIds: [centroCorte.id, centroBarba.id, centroMassagem.id],
  })

  const rafael = await createUser({
    name: "Rafael Costa",
    email: "rafael@vigbarber.com",
    role: Role.EMPLOYEE,
    image: AVATARS.rafael,
  })
  await addMember(rafael.id, centro.id, MemberRole.EMPLOYEE)
  const rafaelEmployee = await createEmployee({
    userId: rafael.id,
    barbershopId: centro.id,
    bio: "Mestre em barba e acabamentos, focado em técnicas de navalha.",
    imageUrl: AVATARS.rafael,
    serviceIds: [centroBarba.id, centroSobrancelha.id, centroPezinho.id],
  })

  const lucas = await createUser({
    name: "Lucas Almeida",
    email: "lucas@vigbarber.com",
    role: Role.EMPLOYEE,
    image: AVATARS.lucas,
  })
  await addMember(lucas.id, centro.id, MemberRole.EMPLOYEE)
  await createEmployee({
    userId: lucas.id,
    barbershopId: centro.id,
    bio: "Apaixonado por tendências, especializado em cortes degradê e design.",
    imageUrl: AVATARS.lucas,
    serviceIds: [centroCorte.id, centroHidratacao.id, centroMassagem.id],
  })

  // Miguel works in two shops: Vig Barber Centro and Navalha de Ouro
  const miguel = await createUser({
    name: "Miguel Silva Menezes",
    email: "miguel@vigbarber.com",
    role: Role.EMPLOYEE,
    image: AVATARS.miguel,
  })
  await addMember(miguel.id, centro.id, MemberRole.EMPLOYEE)
  await addMember(miguel.id, navalha.id, MemberRole.EMPLOYEE)
  const miguelCentro = await createEmployee({
    userId: miguel.id,
    barbershopId: centro.id,
    bio: "Especialista em cortes clássicos e modernos, com mais de 8 anos de experiência.",
    imageUrl: AVATARS.miguel,
    serviceIds: [centroCorte.id, centroPezinho.id, centroHidratacao.id],
  })
  const miguelNavalha = await createEmployee({
    userId: miguel.id,
    barbershopId: navalha.id,
    bio: "Aos sábados na Navalha de Ouro, cortes clássicos na tesoura.",
    imageUrl: AVATARS.miguel,
    serviceIds: [navalhaCorte.id, navalhaCombo.id],
  })

  const thiago = await createUser({
    name: "Thiago Oliveira",
    email: "thiago@navalhadeouro.com",
    role: Role.EMPLOYEE,
    image: AVATARS.thiago,
  })
  await addMember(thiago.id, navalha.id, MemberRole.EMPLOYEE)
  const thiagoEmployee = await createEmployee({
    userId: thiago.id,
    barbershopId: navalha.id,
    bio: "Barbeiro old school, referência em barba na navalha.",
    imageUrl: AVATARS.thiago,
    serviceIds: [
      navalhaBarba.id,
      navalhaCombo.id,
      navalhaPigmentacao.id,
      navalhaCorte.id,
    ],
  })

  const bruno = await createUser({
    name: "Bruno Ferreira",
    email: "bruno@barbanegra.com",
    role: Role.EMPLOYEE,
    image: AVATARS.bruno,
  })
  await addMember(bruno.id, barbaNegra.id, MemberRole.EMPLOYEE)
  const brunoEmployee = await createEmployee({
    userId: bruno.id,
    barbershopId: barbaNegra.id,
    bio: "Rei do degradê na Zona Leste.",
    imageUrl: AVATARS.bruno,
    serviceIds: [negraDegrade.id, negraSobrancelha.id],
  })

  const diego = await createUser({
    name: "Diego Martins",
    email: "diego@barbanegra.com",
    role: Role.EMPLOYEE,
    image: AVATARS.diego,
  })
  await addMember(diego.id, barbaNegra.id, MemberRole.EMPLOYEE)
  const diegoEmployee = await createEmployee({
    userId: diego.id,
    barbershopId: barbaNegra.id,
    bio: "Barbas completas e tratamentos capilares.",
    imageUrl: AVATARS.diego,
    serviceIds: [negraBarba.id, negraRelaxamento.id, negraDegrade.id],
  })

  console.log("Criando atendente e clientes...")
  // Juliana is the front desk (ATENDENTE) at Vig Barber Centro and a regular
  // client at Navalha de Ouro
  const juliana = await createUser({
    name: "Juliana Santos",
    email: "juliana@vigbarber.com",
    role: Role.ATENDENTE,
    phone: "(11) 99120-4433",
  })
  await addMember(juliana.id, centro.id, MemberRole.ATENDENTE)

  const joao = await createUser({
    name: "João Cliente",
    email: "cliente@example.com",
    role: Role.CLIENT,
    phone: "(11) 98111-2233",
  })
  const pedro = await createUser({
    name: "Pedro Henrique Lima",
    email: "pedro@example.com",
    role: Role.CLIENT,
    phone: "(11) 97333-4455",
  })

  console.log("Criando agendamentos...")
  const createBooking = (data: {
    barbershopId: string
    userId: string
    employeeId: string
    barbershopServiceId: string
    bookingDate: Date
    status?: BookingStatus
    paymentMethod?: PaymentMethod
  }) => prisma.booking.create({ data })

  // Vig Barber Centro
  const joaoPastCentro = await createBooking({
    barbershopId: centro.id,
    userId: joao.id,
    employeeId: miguelCentro.id,
    barbershopServiceId: centroCorte.id,
    bookingDate: brazilDate(-10, 10),
    status: BookingStatus.COMPLETED,
    paymentMethod: PaymentMethod.PIX,
  })
  await createBooking({
    barbershopId: centro.id,
    userId: pedro.id,
    employeeId: rafaelEmployee.id,
    barbershopServiceId: centroBarba.id,
    bookingDate: brazilDate(-5, 15),
    status: BookingStatus.COMPLETED,
    paymentMethod: PaymentMethod.CARD,
  })
  await createBooking({
    barbershopId: centro.id,
    userId: pedro.id,
    employeeId: ricardoEmployee.id,
    barbershopServiceId: centroCorte.id,
    bookingDate: brazilDate(-3, 11),
    status: BookingStatus.CANCELLED,
  })
  await createBooking({
    barbershopId: centro.id,
    userId: joao.id,
    employeeId: ricardoEmployee.id,
    barbershopServiceId: centroMassagem.id,
    bookingDate: brazilDate(3, 14),
  })

  // Navalha de Ouro (Juliana books here as a client)
  const julianaPastNavalha = await createBooking({
    barbershopId: navalha.id,
    userId: juliana.id,
    employeeId: thiagoEmployee.id,
    barbershopServiceId: navalhaCorte.id,
    bookingDate: brazilDate(-7, 18),
    status: BookingStatus.COMPLETED,
    paymentMethod: PaymentMethod.CASH,
  })
  await createBooking({
    barbershopId: navalha.id,
    userId: juliana.id,
    employeeId: miguelNavalha.id,
    barbershopServiceId: navalhaCombo.id,
    bookingDate: brazilDate(5, 10),
  })
  await createBooking({
    barbershopId: navalha.id,
    userId: pedro.id,
    employeeId: thiagoEmployee.id,
    barbershopServiceId: navalhaBarba.id,
    bookingDate: brazilDate(2, 16, 30),
  })

  // Barba Negra
  const joaoPastNegra = await createBooking({
    barbershopId: barbaNegra.id,
    userId: joao.id,
    employeeId: brunoEmployee.id,
    barbershopServiceId: negraDegrade.id,
    bookingDate: brazilDate(-4, 19),
    status: BookingStatus.COMPLETED,
    paymentMethod: PaymentMethod.PIX,
  })
  await createBooking({
    barbershopId: barbaNegra.id,
    userId: pedro.id,
    employeeId: diegoEmployee.id,
    barbershopServiceId: negraRelaxamento.id,
    bookingDate: brazilDate(4, 9, 30),
  })

  console.log("Criando avaliações...")
  await prisma.review.createMany({
    data: [
      {
        barbershopId: centro.id,
        bookingId: joaoPastCentro.id,
        userId: joao.id,
        employeeId: miguelCentro.id,
        rating: 5,
        comment: "Corte impecável, atendimento nota 10!",
      },
      {
        barbershopId: navalha.id,
        bookingId: julianaPastNavalha.id,
        userId: juliana.id,
        employeeId: thiagoEmployee.id,
        rating: 4,
        comment: "Ótimo ambiente, só atrasou um pouquinho.",
      },
      {
        barbershopId: barbaNegra.id,
        bookingId: joaoPastNegra.id,
        userId: joao.id,
        employeeId: brunoEmployee.id,
        rating: 5,
        comment: "Melhor degradê da Zona Leste.",
      },
    ],
  })

  console.log("Criando despesas...")
  await prisma.expense.createMany({
    data: [
      {
        barbershopId: centro.id,
        description: "Aluguel do salão",
        amount: 4500,
        category: ExpenseCategory.ALUGUEL,
        date: brazilDate(-12, 10),
      },
      {
        barbershopId: centro.id,
        description: "Lâminas e pomadas",
        amount: 380.5,
        category: ExpenseCategory.PRODUTOS,
        date: brazilDate(-6, 10),
      },
      {
        barbershopId: centro.id,
        description: "Conta de energia",
        amount: 620.9,
        category: ExpenseCategory.CONTAS,
        date: brazilDate(-2, 10),
      },
      {
        barbershopId: navalha.id,
        description: "Aluguel do salão",
        amount: 3800,
        category: ExpenseCategory.ALUGUEL,
        date: brazilDate(-12, 10),
      },
      {
        barbershopId: navalha.id,
        description: "Manutenção das cadeiras",
        amount: 450,
        category: ExpenseCategory.MANUTENCAO,
        date: brazilDate(-8, 10),
      },
      {
        barbershopId: barbaNegra.id,
        description: "Aluguel do salão",
        amount: 2900,
        category: ExpenseCategory.ALUGUEL,
        date: brazilDate(-12, 10),
      },
      {
        barbershopId: barbaNegra.id,
        description: "Anúncios no Instagram",
        amount: 250,
        category: ExpenseCategory.MARKETING,
        date: brazilDate(-3, 10),
      },
      {
        barbershopId: barbaNegra.id,
        description: "Máquina de corte nova",
        amount: 899.9,
        category: ExpenseCategory.EQUIPAMENTOS,
        date: brazilDate(-1, 10),
      },
    ],
  })

  console.log("Seed concluído com sucesso!")
  console.log(`Senha de todos os usuários: ${DEFAULT_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
