'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Student {
  id: number;
  name: string;
  email: string | null;
  age: number | null;
  latitude: number | null;
  longitude: number | null;
}

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // State สำหรับ Modal (เพิ่ม/แก้ไข)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // State เก็บค่าจาก Form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    latitude: '',
    longitude: '',
  });

  // 1. ดึงข้อมูลนักศึกษา
  const getStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching data:', error.message);
        alert('ไม่สามารถดึงข้อมูลได้: ' + error.message);
      } else {
        setStudents(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStudents();
  }, []);

  // 2. เปิด Modal สำหรับ "เพิ่ม" ข้อมูล
  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormData({ name: '', email: '', age: '', latitude: '', longitude: '' });
    setIsModalOpen(true);
  };

  // 3. เปิด Modal สำหรับ "แก้ไข" ข้อมูล
  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      email: student.email || '',
      age: student.age != null ? student.age.toString() : '',
      latitude: student.latitude != null ? student.latitude.toString() : '',
      longitude: student.longitude != null ? student.longitude.toString() : '',
    });
    setIsModalOpen(true);
  };

  // 4. บันทึกข้อมูล (รองรับทั้ง Add และ Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('กรุณากรอกชื่อ');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      age: formData.age ? Number(formData.age) : null,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
    };

    if (editingStudent) {
      // แก้ไขข้อมูล (UPDATE)
      const { error } = await supabase
        .from('students')
        .update(payload)
        .eq('id', editingStudent.id);

      if (error) {
        alert('เกิดข้อผิดพลาดในการแก้ไข: ' + error.message);
      } else {
        setIsModalOpen(false);
        getStudents();
      }
    } else {
      // เพิ่มข้อมูลใหม่ (INSERT)
      const { error } = await supabase.from('students').insert([payload]);

      if (error) {
        alert('เกิดข้อผิดพลาดในการเพิ่มข้อมูล: ' + error.message);
      } else {
        setIsModalOpen(false);
        getStudents();
      }
    }
  };

  // 5. ลบข้อมูล (DELETE)
  const handleDelete = async (id: number) => {
    if (confirm(`คุณต้องการลบข้อมูล ID: ${id} ใช่หรือไม่?`)) {
      const { error } = await supabase.from('students').delete().eq('id', id);

      if (error) {
        alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
      } else {
        getStudents();
      }
    }
  };

  // 6. ฟังก์ชันกรองค้นหาทุกฟิลด์
  const filteredStudents = students.filter((student) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;

    return (
      student.id?.toString().includes(term) ||
      student.name?.toLowerCase().includes(term) ||
      student.email?.toLowerCase().includes(term) ||
      student.age?.toString().includes(term) ||
      student.latitude?.toString().includes(term) ||
      student.longitude?.toString().includes(term)
    );
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center">ระบบจัดการนักศึกษา</h1>
      <p className="text-center text-gray-500 mb-6">Student Management System</p>

      {/* แถบควบคุม: ค้นหา & ปุ่มเพิ่มข้อมูล */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="ค้นหาข้อมูล..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          onClick={handleOpenAddModal}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
        >
          + เพิ่มนักศึกษา
        </button>
      </div>

      {/* ตารางข้อมูล */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-white uppercase bg-blue-600">
            <tr>
              <th scope="col" className="px-4 py-3 text-center">
                ID
              </th>
              <th scope="col" className="px-4 py-3">
                ชื่อ
              </th>
              <th scope="col" className="px-4 py-3">
                Email
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                อายุ
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Latitude
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Longitude
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="bg-white border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4 font-medium text-gray-900 text-center">
                    {student.id}
                  </td>
                  <td className="px-4 py-4 font-semibold text-gray-800">
                    {student.name}
                  </td>
                  <td className="px-4 py-4">{student.email || '-'}</td>
                  <td className="px-4 py-4 text-center">{student.age ?? '-'}</td>
                  <td className="px-4 py-4 text-center font-mono text-xs text-blue-600">
                    {student.latitude ?? '-'}
                  </td>
                  <td className="px-4 py-4 text-center font-mono text-xs text-green-600">
                    {student.longitude ?? '-'}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(student)}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-2.5 py-1.5 rounded transition-colors"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1.5 rounded transition-colors"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  {searchTerm
                    ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา'
                    : 'ยังไม่มีข้อมูลนักศึกษา'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
        <span>
          {searchTerm && `พบ ${filteredStudents.length} รายการจากการค้นหา`}
        </span>
        <span>รวมทั้งหมด {students.length} คน</span>
      </div>

      {/* Modal เพิ่ม/แก้ไข */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {editingStudent
                ? 'แก้ไขข้อมูลนักศึกษา'
                : 'เพิ่มนักศึกษาใหม่'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  ชื่อ - นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น สมชาย ใจดี"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น somchai@email.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  อายุ
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น 20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="13.7563"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100.5018"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}