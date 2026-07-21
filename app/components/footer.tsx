const Footer = () => {
  return (
    <footer className="border-t px-6 py-5">
      <p className="text-sm text-gray-400">
        © {new Date().getFullYear()}{" "}
        <span className="font-bold">Vig Barber</span>. Todos os direitos
        reservados.
      </p>
    </footer>
  )
}

export default Footer
