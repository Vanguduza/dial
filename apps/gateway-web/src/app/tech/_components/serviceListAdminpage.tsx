 


// import { IService } from "@/types/types.service";
// import { getAllServicesss } from "../_actions/getAllServices";

// export async function ServicesListAdminPage({
//   searchParams,
// }: {
//   searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
// }) {
//   const query = await searchParams;
//   const result = await getAllServicesss({ query });
// console.log(result)
//   if (!result.success || !result.data?.length) {
//     return (
//       <p className="py-12 text-center text-muted-foreground">
//         No premium Service found.
//       </p>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
//         {/* {result.data.map((service: IService) => (
//           <ServiceCard key={service.id} service={service} />
//         ))} */}
//       </div>
//     </div>
//   );
// }













import { getAllServicesss } from "../../../lib/tech/fixitnowActions";
import { ServicesTable } from "./ServicesTable";

export async function ServicesListAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const result = await getAllServicesss({ query });

  if (!result.success || !result.data?.length) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No services found.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <ServicesTable data={result.data} />
    </div>
  );
}