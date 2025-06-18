-- 创建profiles表
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT,
    email TEXT,
    job_title TEXT,
    avatar_url TEXT,
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建RLS策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 创建公开访问策略（允许查看）
CREATE POLICY "允许公开查看profiles" ON public.profiles
    FOR SELECT USING (true);

-- 创建个人数据修改策略（只能修改自己的数据）
CREATE POLICY "允许用户修改自己的profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 创建个人数据插入策略（只能为自己创建profile）
CREATE POLICY "允许用户创建自己的profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 创建函数：在用户注册时自动创建profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, email)
    VALUES (new.id, new.raw_user_meta_data->>'username', new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：在用户注册时自动创建profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 