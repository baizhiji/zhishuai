import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accountService, StaffInfo } from '../services/account.service';

const DEPARTMENTS = ['运营部', '销售部', '技术部', '人事部', '财务部', '市场部', '客服部'];
const ROLES = ['超级管理员', '管理员', '运营专员', '客服专员', '财务专员', '普通员工'];

export default function StaffManagementScreen() {
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffInfo[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffInfo | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    department: DEPARTMENTS[0],
    role: ROLES[2],
    status: 'active' as 'active' | 'inactive',
  });
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await accountService.getStaffList();
      setStaffList(list);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      department: DEPARTMENTS[0],
      role: ROLES[2],
      status: 'active',
    });
    setModalVisible(true);
  };

  const handleEdit = (staff: StaffInfo) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      phone: staff.phone,
      email: staff.email,
      department: staff.department,
      role: staff.role,
      status: staff.status,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      '确认删除',
      `确定删除员工「${name}」吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await accountService.deleteStaff(id);
            setStaffList(staffList.filter(s => s.id !== id));
            Alert.alert('成功', '删除成功');
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      Alert.alert('提示', '请填写姓名和手机号');
      return;
    }

    if (editingStaff) {
      // 编辑
      await accountService.updateStaff(editingStaff.id, formData);
      setStaffList(
        staffList.map(s => (s.id === editingStaff.id ? { ...s, ...formData } : s))
      );
      Alert.alert('成功', '编辑成功');
    } else {
      // 新增
      const newStaff = await accountService.addStaff(formData);
      setStaffList([newStaff, ...staffList]);
      Alert.alert('成功', '添加成功');
    }
    setModalVisible(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case '超级管理员':
        return '#EF4444';
      case '管理员':
        return '#F97316';
      case '运营专员':
        return '#22C55E';
      case '客服专员':
        return '#06B6D4';
      case '财务专员':
        return '#8B5CF6';
      default:
        return '#64748B';
    }
  };

  const filteredList = staffList.filter(
    item =>
      item.name.includes(searchText) ||
      item.phone.includes(searchText) ||
      item.department.includes(searchText)
  );

  const renderItem = ({ item }: { item: StaffInfo }) => (
    <TouchableOpacity style={styles.staffCard} onPress={() => handleEdit(item)}>
      <View style={styles.staffAvatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.staffInfo}>
        <View style={styles.staffHeader}>
          <Text style={styles.staffName}>{item.name}</Text>
          <View style={[styles.roleTag, { backgroundColor: getRoleColor(item.role) + '20' }]}>
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
              {item.role}
            </Text>
          </View>
        </View>
        <Text style={styles.staffPhone}>{item.phone}</Text>
        <View style={styles.staffFooter}>
          <View style={styles.deptBadge}>
            <Text style={styles.deptText}>{item.department}</Text>
          </View>
          <View style={[styles.statusBadge, item.status === 'active' && styles.statusActive]}>
            <Text style={[styles.statusText, item.status === 'active' && styles.statusTextActive]}>
              {item.status === 'active' ? '正常' : '禁用'}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id, item.name)}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索员工姓名、手机号、部门"
            placeholderTextColor="#94A3B8"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 员工列表 */}
      <FlatList
        data={filteredList}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>暂无员工数据</Text>
          </View>
        }
      />

      {/* 添加/编辑弹窗 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingStaff ? '编辑员工' : '添加员工'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.formContainer}>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>姓名 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入姓名"
                  value={formData.name}
                  onChangeText={text => setFormData({ ...formData, name: text })}
                />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>手机号 *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入手机号"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={text => setFormData({ ...formData, phone: text })}
                />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>邮箱</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="请输入邮箱"
                  keyboardType="email-address"
                  value={formData.email}
                  onChangeText={text => setFormData({ ...formData, email: text })}
                />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>部门</Text>
                <View style={styles.optionsContainer}>
                  {DEPARTMENTS.map(dept => (
                    <TouchableOpacity
                      key={dept}
                      style={[
                        styles.optionItem,
                        formData.department === dept && styles.optionItemSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, department: dept })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          formData.department === dept && styles.optionTextSelected,
                        ]}
                      >
                        {dept}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>角色</Text>
                <View style={styles.optionsContainer}>
                  {ROLES.map(role => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.optionItem,
                        formData.role === role && styles.optionItemSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, role: role })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          formData.role === role && styles.optionTextSelected,
                        ]}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1E293B',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  staffCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  staffInfo: {
    flex: 1,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 8,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  staffPhone: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  staffFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deptBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  deptText: {
    fontSize: 11,
    color: '#3B82F6',
  },
  statusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 11,
    color: '#64748B',
  },
  statusTextActive: {
    color: '#22C55E',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  formContainer: {
    padding: 16,
  },
  formItem: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionItem: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  optionItemSelected: {
    backgroundColor: '#3B82F6',
  },
  optionText: {
    fontSize: 13,
    color: '#64748B',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
