'use client';

//estou usando a bliblioteca zod para validação de formulários, chamada react-hook-form
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@radix-ui/react-label';
import { use } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import z from 'zod';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';

const formSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type FormValues = z.infer<typeof formSchema>;

const SigInForm = () => {
    const router = useRouter();
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

async function onSubmit(values: FormValues) {
      
      await authClient.signIn.email({
        email: values.email, // required
        password: values.password, // required
        fetchOptions: {
          onSuccess: () => {
            router.push('/'); // Redireciona para a página inicial após o sucesso
            toast.success('Login realizado com sucesso!');
          },
              onError: (ctx) => {
          if (ctx.error.code === "USER_NOT_FOUND") {
            toast.error("E-mail não encontrado.");
            return form.setError("email", {
              message: "E-mail não encontrado.",
            });
          }
          if (ctx.error.code === "INVALID_EMAIL_OR_PASSWORD") {
            toast.error("E-mail ou senha inválidos.");
            form.setError("password", {
              message: "E-mail ou senha inválidos.",
            });
            return form.setError("email", {
              message: "E-mail ou senha inválidos.",
            });
          }
          toast.error(ctx.error.message);
        },


        }, 
      }); 
}


    return (       
        <>
        <Card>
            <CardHeader>
              <CardTitle>Entrar</CardTitle>
              <CardDescription>
               Faça login para continuar.
              </CardDescription>
            </CardHeader>

            
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         <CardContent className="grid gap-6">
               <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Digitte seu email" {...field} />
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

         </CardContent>
            <CardFooter>
             <Button type="submit">Entrar</Button>
            </CardFooter>

        </form>
        </Form>
   
          </Card>
        </>

        );
};

    export default SigInForm;