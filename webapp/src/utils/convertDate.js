export const convertDate = (date_string) => {
  let date = new Date(date_string)

  // Get the hours, minutes, day, month, and year
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const day = date.getDate()
  const month = date.getMonth() + 1 // Add 1, as JavaScript months are zero-based
  const year = date.getFullYear()

  // Format the date string
  date = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`

  return date
}

export const getHours = (date_string) => {
  let date = new Date(date_string)

  const hours = date.getHours()
  const minutes = date.getMinutes()

  date = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

  return date
}


export const getLocalString = (date_string, omitBr = false) => {
  let date = new Date(date_string)

  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  date = date.toLocaleDateString('ru-RU', options)

  if (!omitBr) {
    date = date.replace(',', ',<br>')
  } 

  return date
}