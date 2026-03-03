import { useState } from "react"; // 1. Import useEffect
import api from "../services/api";
import { useBusiness } from "../context/BusinessContext";

const Businesses = () => {
  // 2. Destructure businesses and fetchBusinesses
  const { businesses, fetchBusinesses } = useBusiness();

  const [formData, setFormData] = useState({
    name: "",
    gstNumber: "",
    address: "",
    phone: "",
    email: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
  });
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(false);

  // 3. ADD THIS: Fetch data when this page loads
  // useEffect(() => {
  //   fetchBusinesses();
  // }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("gstNumber", formData.gstNumber);
      data.append("address", formData.address);
      data.append("phone", formData.phone);
      data.append("email", formData.email);

      data.append(
        "bankDetails",
        JSON.stringify({
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifsc: formData.ifsc,
        }),
      );

      if (logo) data.append("logo", logo);

      await api.post("/businesses", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Refresh the list after adding
      await fetchBusinesses();

      alert("Business Added Successfully");

      // Reset form
      setFormData({
        name: "",
        gstNumber: "",
        address: "",
        phone: "",
        email: "",
        bankName: "",
        accountNumber: "",
        ifsc: "",
      });
      setLogo(null);
      // Reset file input manually if needed
      document.getElementById("fileInput").value = "";
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error adding business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 ml-64">
      <h2 className="text-2xl font-bold mb-6">Manage Businesses</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="font-semibold mb-4">Add New Business</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full border p-2 rounded"
              placeholder="Business Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                className="w-full border p-2 rounded"
                placeholder="GST Number"
                value={formData.gstNumber}
                onChange={(e) =>
                  setFormData({ ...formData, gstNumber: e.target.value })
                }
              />
              <input
                className="w-full border p-2 rounded"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
            </div>
            <input
              className="w-full border p-2 rounded"
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            <textarea
              className="w-full border p-2 rounded"
              placeholder="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
            />

            <h4 className="font-medium text-gray-600 mt-2">Bank Details</h4>
            <div className="grid grid-cols-3 gap-2">
              <input
                className="w-full border p-2 rounded"
                placeholder="Bank Name"
                value={formData.bankName}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
              />
              <input
                className="w-full border p-2 rounded"
                placeholder="Acc No"
                value={formData.accountNumber}
                onChange={(e) =>
                  setFormData({ ...formData, accountNumber: e.target.value })
                }
              />
              <input
                className="w-full border p-2 rounded"
                placeholder="IFSC"
                value={formData.ifsc}
                onChange={(e) =>
                  setFormData({ ...formData, ifsc: e.target.value })
                }
              />
            </div>

            <div className="mt-2">
              <label className="block text-sm text-gray-600">Logo</label>
              <input
                id="fileInput"
                type="file"
                onChange={(e) => setLogo(e.target.files[0])}
              />
            </div>

            <button
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Business"}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="font-semibold mb-4">
            Your Businesses ({businesses?.length || 0})
          </h3>

          <div className="space-y-4">
            {/* 4. Use Optional Chaining (?.) to prevent crashes */}
            {businesses && businesses.length > 0 ? (
              businesses.map((b) => (
                <div
                  key={b._id}
                  className="border p-4 rounded flex justify-between items-center hover:bg-gray-50"
                >
                  <div>
                    <p className="font-bold text-lg">{b.name}</p>
                    <p className="text-sm text-gray-500">GST: {b.gstNumber}</p>
                    <p className="text-sm text-gray-500">{b.address}</p>
                  </div>

                  {b.logoUrl && (
                    <img
                      src={`${import.meta.env.VITE_API_URL.replace("/api", "")}/${b.logoUrl}`}
                      alt="logo"
                      className="h-16 w-16 object-contain border rounded"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/64?text=No+Logo";
                      }}
                    />
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                No businesses found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Businesses;
