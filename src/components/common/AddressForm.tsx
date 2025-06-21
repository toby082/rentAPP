import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Row, Col, Button } from 'antd';
import { showMessage } from '@/hooks/useMessage';
import type { Address, User, Merchant, UserType } from '@/types';
import { getProvinces, getCitiesByProvinceName, getDistrictsByCityName, type Province, type City, type District } from '@/utils/addressData';

const { Option } = Select;

interface AddressFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  address?: Address | null;
  onSubmit: (addressData: Partial<Address>) => Promise<void>;
  title?: string;
  user?: User | Merchant | null;
  userType?: UserType | null;
}

const AddressForm: React.FC<AddressFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  address,
  onSubmit,
  title = '添加地址',
  user,
  userType
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  // 初始化省份数据
  useEffect(() => {
    const provinceList = getProvinces();
    setProvinces(provinceList);
  }, []);

  // 当地址数据变化时，更新表单
  useEffect(() => {
    if (visible) {
      if (address) {
        // 编辑现有地址
        form.setFieldsValue({
          contactName: address.contactName,
          contactPhone: address.contactPhone,
          province: address.province,
          city: address.city,
          district: address.district,
          detailAddress: address.detailAddress,
          isDefault: address.isDefault === 1
        });
        
        // 设置对应的城市和区县选项
        if (address.province) {
          const cityList = getCitiesByProvinceName(address.province);
          setCities(cityList);
        }
        if (address.city && address.province) {
          const districtList = getDistrictsByCityName(address.city, address.province);
          setDistricts(districtList);
        }
      } else {
        // 添加新地址，自动填入联系人和手机号
        form.resetFields();
        setCities([]);
        setDistricts([]);
        
        // 根据用户类型自动填入联系人和手机号
        if (user && userType) {
          const autoFillData: any = {
            contactPhone: user.phone, // 用户和商家都有phone字段
            isDefault: false
          };
          
          // 根据用户类型设置联系人姓名
          if (userType === 'user') {
            const userData = user as User;
            autoFillData.contactName = userData.nickname;
          } else if (userType === 'merchant') {
            const merchantData = user as Merchant;
            autoFillData.contactName = merchantData.contactName;
          }
          
          form.setFieldsValue(autoFillData);
        }
      }
    }
  }, [visible, address, form, user, userType]);

  // 省份变化时更新城市选项
  const handleProvinceChange = (province: string) => {
    const cityList = getCitiesByProvinceName(province);
    setCities(cityList);
    setDistricts([]);
    
    // 清空城市和区县字段
    form.setFieldsValue({
      city: undefined,
      district: undefined
    });
  };

  // 城市变化时更新区县选项
  const handleCityChange = (city: string) => {
    const currentProvince = form.getFieldValue('province');
    const districtList = getDistrictsByCityName(city, currentProvince);
    setDistricts(districtList);
    
    // 清空区县字段
    form.setFieldsValue({
      district: undefined
    });
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const addressData: Partial<Address> = {
        contactName: values.contactName,
        contactPhone: values.contactPhone,
        province: values.province,
        city: values.city,
        district: values.district,
        detailAddress: values.detailAddress,
        isDefault: values.isDefault ? 1 : 0
      };

      await onSubmit(addressData);
      showMessage.success(address ? '地址更新成功' : '地址添加成功');
      onSuccess();
    } catch (error) {
      console.error('提交地址失败:', error);
      // 错误消息已在API拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {address ? '更新' : '添加'}
        </Button>
      ]}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          isDefault: false
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="联系人"
              name="contactName"
              rules={[
                { required: true, message: '请输入联系人姓名' },
                { min: 2, max: 10, message: '联系人姓名长度为2-10个字符' }
              ]}
            >
              <Input placeholder="请输入联系人姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="联系电话"
              name="contactPhone"
              rules={[
                { required: true, message: '请输入联系电话' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
              ]}
            >
              <Input placeholder="请输入11位手机号码" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="省份"
              name="province"
              rules={[{ required: true, message: '请选择省份' }]}
            >
              <Select
                placeholder="请选择省份"
                onChange={handleProvinceChange}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {provinces.map(province => (
                  <Option key={province.id} value={province.name}>
                    {province.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="城市"
              name="city"
              rules={[{ required: true, message: '请选择城市' }]}
            >
              <Select
                placeholder="请选择城市"
                onChange={handleCityChange}
                disabled={cities.length === 0}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {cities.map(city => (
                  <Option key={city.id} value={city.name}>
                    {city.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="区县"
              name="district"
              rules={[{ required: true, message: '请选择区县' }]}
            >
              <Select
                placeholder="请选择区县"
                disabled={districts.length === 0}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {districts.map(district => (
                  <Option key={district.id} value={district.name}>
                    {district.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="详细地址"
          name="detailAddress"
          rules={[
            { required: true, message: '请输入详细地址' },
            { min: 5, max: 100, message: '详细地址长度为5-100个字符' }
          ]}
        >
          <Input.TextArea
            placeholder="请输入详细地址，如街道、门牌号、楼层等"
            rows={3}
            showCount
            maxLength={100}
          />
        </Form.Item>

        <Form.Item
          label="设为默认地址"
          name="isDefault"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddressForm; 