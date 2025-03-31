// import React from 'react';
// import Section from './Section';

// function LowStockAlerts({ openModal }) {
//   const lowStockData = [
//     {
//       medicine: "Insulin",
//       category: "Hormone",
//       currentStock: 45,
//       reorderLevel: 50,
//       status: "warning"
//     },
//     {
//       medicine: "Amoxicillin",
//       category: "Antibiotic",
//       currentStock: 25,
//       reorderLevel: 100,
//       status: "danger"
//     },
//     {
//       medicine: "Paracetamol",
//       category: "Pain Relief",
//       currentStock: 78,
//       reorderLevel: 75,
//       status: "success"
//     }
//   ];

//   return (
//     <Section 
//       title="Low Stock Alerts" 
//       button={
//         <button className="btn btn-primary" onClick={() => openModal('reorderModal')}>
//           Reorder
//         </button>
//       }
//     >
//       <table>
//         <thead>
//           <tr>
//             <th>Medicine</th>
//             <th>Category</th>
//             <th>Current Stock</th>
//             <th>Reorder Level</th>
//             <th>Status</th>
//             <th>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {lowStockData.map((item, index) => (
//             <tr key={index}>
//               <td>{item.medicine}</td>
//               <td>{item.category}</td>
//               <td>{item.currentStock}</td>
//               <td>{item.reorderLevel}</td>
//               <td>
//                 <span className={`badge badge-${item.status}`}>
//                   {item.status === 'warning' && 'Low Stock'}
//                   {item.status === 'danger' && 'Critical'}
//                   {item.status === 'success' && 'Adequate'}
//                 </span>
//               </td>
//               <td>
//                 <button 
//                   className="btn btn-primary btn-sm" 
//                   onClick={() => openModal('orderModal')}
//                 >
//                   Order
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </Section>
//   );
// }

// export default LowStockAlerts;