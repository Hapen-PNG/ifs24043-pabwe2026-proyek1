export default async function loadSweetAlert() {
  return (await import('sweetalert2')).default
}
