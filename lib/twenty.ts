import { TwentyCreateDTO, TwentyUpdateDTO } from "@/types/models";

const API_KEY = process.env.TWENTY_API_KEY;
const BASE_URL = process.env.TWENTY_API_URL;

export async function createTwentyLead(data: TwentyCreateDTO) {
  return await fetch(`${BASE_URL}/appUsers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function updateTwentyUser(data: TwentyUpdateDTO) {
  console.log(data);

  const searchResponse = await fetch(`${BASE_URL}/app-users?filter[email][primaryEmail][eq]=${data.email.primaryEmail}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const searchResult = await searchResponse.json();
  const existingRecord = searchResult.data?.[0];

  console.log(searchResult);

  if (existingRecord?.id) {
    return await fetch(`${BASE_URL}/appUsers/${existingRecord.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
  }
}