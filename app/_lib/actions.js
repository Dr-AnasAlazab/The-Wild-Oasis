"use server";

import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "./auth";
import { supabase } from "./supabase";
import { getBookings } from "./data-service";
import { redirect } from "next/navigation";

export async function updateGuest(formData) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const nationalID = formData.get("nationalID");
  const [nationality, countryFlag] = formData.get("nationality").split("%");

  if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalID))
    throw new Error("Please provide a valid national ID");

  const updateData = { nationality, countryFlag, nationalID };

  const { data, error } = await supabase
    .from("guests")
    .update(updateData)
    .eq("id", session.user.guestId);

  if (error) {
    throw new Error("Guest could not be updated");
  }

  revalidatePath("/account/profile");
}

export async function updateReservation(formData) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const bookingId = Number(formData.get("id"));
  const guestBookings = await getBookings(session.user.guestId);
  const guestBookignsIds = guestBookings.map((booking) => booking.id);
  console.log(guestBookignsIds);

  if (!guestBookignsIds.includes(bookingId)) {
    throw new Error("You are not allowed to Update this booking");
  }
  const numGuests = formData.get("numGuests");
  const observations = formData.get("observations");

  const updatedFields = { numGuests, observations };

  const { data, error } = await supabase
    .from("bookings")
    .update(updatedFields)
    .eq("id", bookingId)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Booking could not be updated");
  }
  // revalidatePath("/account/reservations/edit");

  redirect("/account/reservations");
}

export async function createBooking(bookingData, formData) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const newBooking = {
    ...bookingData,
    guestId: session.user.guestId,
    numGuests: Number(formData.get("numGuests")),
    observations: formData.get("observations").slice(0, 1000),
    extraPrice: 0,
    totalPrice: bookingData.cabinPrice,
    isPaid: false,
    hasBreakFast: false,
    status: "unconfirmed",
  };
  console.log(newBooking);

  const { error } = await supabase
    .from("bookings")
    .insert([newBooking])
    .select();

  if (error) throw new Error("Booking could not be created");

  revalidatePath(`/cabins/${bookingData.cabinId}`);

  redirect("/cabins/thank-you");
}

export async function deleteReservation(bookingId) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookignsIds = guestBookings.map((booking) => booking.id);
  console.log(guestBookignsIds);

  if (!guestBookignsIds.includes(bookingId)) {
    throw new Error("You are not allowed to delete this booking");
  }

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (error) {
    console.error(error);
    throw new Error("Booking could not be deleted");
  }

  revalidatePath("/account/reservations");
}

export async function signInAction() {
  await signIn("google", { redirectTo: "/account" });
}

export async function signOutAction() {
  await signOut({ redirect: "/" });
}
