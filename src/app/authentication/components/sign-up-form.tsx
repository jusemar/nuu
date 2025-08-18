'use client';

//estou usando a bliblioteca zod para validação de formulários, chamada react-hook-form
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@radix-ui/react-label';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const formSchema = z.object({
  name: z.string('Nome obrigatório').trim().min(2, 'O nome O nome é obrigatório'),
  email: z.email('E-mail inválido'),
  password: z.string('Senha inválida').min(8, 'minímo 6 caracteres'),
  passwordConfirmation: z.string('Senha inválida').min(8, 'minímo 6 caracteres'),

}).refine((data) =>{   
    return data.password === data.passwordConfirmation;
},
{
    error: 'As senhas não coincidem',
    path: ['passwordConfirmation'],
},
);

       
type FormValues = z.infer<typeof formSchema>;

const SignUpForm = () => {
    const router = useRouter();
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            passwordConfirmation: '',

        },
    });

async function onSubmit(values: FormValues) {
   await authClient.signUp.email({
    name: values.name,
    email: values.email, // required
    password: values.password, 
    fetchOptions: {
      onSuccess: () => {
        router.push('/'); // Redireciona para a página inicial após o sucesso
        toast.success('Conta criada com sucesso!');
      },
      onError: (error) => {

        if (error.error.code === "USER_ALREADY_EXISTS") {

          toast.error('E-mail já cadastrado');
        return form.setError('email', {
          message: "E-mail já existente",         
      });
    }
        
       toast.error(error.error.message);
    },
  },
       
});      
   
}
    return (       
        <>
        <Card>
            <CardHeader>
              <CardTitle>Criar conta</CardTitle>
              <CardDescription>
               Crie uma conta para continuar.
              </CardDescription>
            </CardHeader>

            
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         <CardContent className="grid gap-6">
          <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite seu nome" {...field} />
                    </FormControl>          
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Digite seu email" {...field} />
              </FormControl>          
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input placeholder="Digitte sua senha" type='password' {...field} />
              </FormControl>          
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="passwordConfirmation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar senha</FormLabel>
              <FormControl>
                <Input placeholder="Digitte sua senha novamente" type='password' {...field} />
              </FormControl>          
              <FormMessage />
            </FormItem>
          )}
        />
          

         </CardContent>
            <CardFooter>
             <Button type="submit">Criar Conta</Button>
            </CardFooter>

        </form>
        </Form>
   
          </Card>
        </>

        );
};

    export default SignUpForm;