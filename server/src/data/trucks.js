const routes = [
  ["Mumbai", "Pune"],
  ["Delhi", "Jaipur"],
  ["Bengaluru", "Chennai"],
  ["Hyderabad", "Vijayawada"],
  ["Kolkata", "Bhubaneswar"],
  ["Ahmedabad", "Surat"],
  ["Lucknow", "Kanpur"],
  ["Chandigarh", "Delhi"],
  ["Kochi", "Coimbatore"],
  ["Nagpur", "Raipur"],
];

const cargoProfiles = [
  { cargoType: "Vaccines", safeTemperature: { min: 2, max: 8 } },
  { cargoType: "Fresh produce", safeTemperature: { min: 3, max: 7 } },
  { cargoType: "Dairy products", safeTemperature: { min: 1, max: 4 } },
  { cargoType: "Frozen food", safeTemperature: { min: -22, max: -18 } },
  { cargoType: "Seafood", safeTemperature: { min: -20, max: -16 } },
];

export const trucks = Object.freeze(
  Array.from({ length: 25 }, (_, index) => {
    const sequence = index + 1;
    const [origin, destination] = routes[index % routes.length];
    const profile = cargoProfiles[index % cargoProfiles.length];

    return Object.freeze({
      truckId: `TRK-${String(sequence).padStart(3, "0")}`,
      displayName: `Polar Runner ${String(sequence).padStart(2, "0")}`,
      cargoType: profile.cargoType,
      safeTemperature: Object.freeze({ ...profile.safeTemperature }),
      route: Object.freeze({ origin, destination }),
    });
  }),
);

export const trucksById = new Map(trucks.map((truck) => [truck.truckId, truck]));

