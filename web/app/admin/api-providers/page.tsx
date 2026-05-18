'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RefreshCw, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface ApiProvider {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  isDefault: boolean;
  priority: number;
  config: any;
  remark: string;
}

const providerTypes = [
  { value: 'coze', label: '扣子 (Coze)' },
  { value: 'volcengine', label: '火山引擎' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'custom', label: '自定义' }
];

export default function ApiProvidersPage() {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ApiProvider | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'coze',
    baseUrl: '',
    apiKey: '',
    enabled: true,
    isDefault: false,
    priority: 0,
    remark: ''
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: ApiProvider[] }>('/admin/api-providers/providers');
      setProviders(res.data || []);
    } catch (error: any) {
      toast.error(error.message || '获取服务商列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (provider?: ApiProvider) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        name: provider.name,
        type: provider.type,
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey, // 显示为 ******
        enabled: provider.enabled,
        isDefault: provider.isDefault,
        priority: provider.priority,
        remark: provider.remark || ''
      });
    } else {
      setEditingProvider(null);
      setFormData({
        name: '',
        type: 'coze',
        baseUrl: '',
        apiKey: '',
        enabled: true,
        isDefault: false,
        priority: 0,
        remark: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.baseUrl) {
        toast.error('请填写必填项');
        return;
      }

      if (editingProvider) {
        await api.put(`/admin/api-providers/providers/${editingProvider.id}`, formData);
        toast.success('更新成功');
      } else {
        await api.post('/admin/api-providers/providers', formData);
        toast.success('创建成功');
      }

      setDialogOpen(false);
      fetchProviders();
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    }
  };

  const handleDelete = async (provider: ApiProvider) => {
    if (!confirm(`确定要删除服务商「${provider.name}」吗？`)) return;

    try {
      await api.delete(`/admin/api-providers/providers/${provider.id}`);
      toast.success('删除成功');
      fetchProviders();
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const handleSetDefault = async (provider: ApiProvider) => {
    try {
      await api.put(`/admin/api-providers/providers/${provider.id}`, {
        ...provider,
        isDefault: true
      });
      toast.success('已设为默认');
      fetchProviders();
    } catch (error: any) {
      toast.error(error.message || '设置失败');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">API 服务商配置</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          添加服务商
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            服务商列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>API地址</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>默认</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      暂无服务商
                    </TableCell>
                  </TableRow>
                ) : (
                  providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {providerTypes.find(t => t.value === provider.type)?.label || provider.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                        {provider.baseUrl}
                      </TableCell>
                      <TableCell>{provider.priority}</TableCell>
                      <TableCell>
                        {provider.enabled ? (
                          <Badge className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            启用
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="w-3 h-3 mr-1" />
                            禁用
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {provider.isDefault && (
                          <Badge className="bg-blue-500">默认</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOpenDialog(provider)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          {!provider.isDefault && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSetDefault(provider)}
                            >
                              设为默认
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDelete(provider)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? '编辑服务商' : '添加服务商'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>名称 *</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="如：扣子官方"
              />
            </div>

            <div className="space-y-2">
              <Label>类型 *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({...formData, type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>API地址 *</Label>
              <Input 
                value={formData.baseUrl}
                onChange={(e) => setFormData({...formData, baseUrl: e.target.value})}
                placeholder="https://api.coze.cn/v1"
              />
            </div>

            <div className="space-y-2">
              <Label>API Key {editingProvider ? '(留空则不修改)' : '*'}</Label>
              <Input 
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                placeholder={editingProvider ? '******' : '输入API Key'}
              />
            </div>

            <div className="space-y-2">
              <Label>优先级</Label>
              <Input 
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})}
                placeholder="数字越小优先级越高"
              />
            </div>

            <div className="space-y-2">
              <Label>备注</Label>
              <Input 
                value={formData.remark}
                onChange={(e) => setFormData({...formData, remark: e.target.value})}
                placeholder="可选备注"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
                  className="w-4 h-4"
                />
                <span>启用</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                  className="w-4 h-4"
                />
                <span>设为默认</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingProvider ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
