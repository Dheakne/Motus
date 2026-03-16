# Motus

Aplicativo de bem-estar mental com funcionalidades de meditação, gratidão, reflexões e gerenciamento de tarefas semanais.

## Sobre o Projeto

O Motus é uma plataforma desenvolvida para auxiliar usuários no cuidado com a saúde mental através de recursos como meditações guiadas, registros de gratidão, reflexões diárias, áudios para sono e técnicas de concentração.

## Funcionalidades

- Cadastro e autenticação de usuários
- Sistema de notificações personalizadas
- Meditações guiadas com áudios
- Registro diário de gratidão
- Reflexões e perguntas para autoconhecimento
- Áudios para auxiliar no sono
- Técnicas de concentração (Pomodoro, Foco Profundo)
- Gerenciamento de tarefas semanais
- Histórico de uso e progresso

## Tecnologias

### Backend

- Microsoft SQL Server
- T-SQL

### Ferramentas

- SQL Server Management Studio (SSMS)

## Estrutura do Banco de Dados

O banco de dados é composto por 14 tabelas principais:

**Configuração:** generos, status_tarefa

**Usuários:** usuarios, configuracoes_usuario, notificacoes

**Conteúdo:** tarefas_semanais, meditacoes, sono, reflexoes, concentracao

**Registros:** tarefas_usuario, gratidao, historico_acessos

## Instalação

### Pré-requisitos

- Microsoft SQL Server 2016 ou superior
- SQL Server Management Studio

### Configuração do Banco

1. Criar o banco de dados:

```sql
CREATE DATABASE Motus_Anime;
USE Motus_Anime;
```

2. Executar os scripts SQL na ordem especificada na documentação

3. Verificar a instalação:

```sql
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';
```

## Padrões de Código

- Nomenclatura de tabelas e colunas em snake_case
- IDs auto-incrementados com IDENTITY
- Formato de data ISO (YYYY-MM-DD)
- Valores booleanos representados como BIT (0 ou 1)

## Licença

Este projeto é de uso acadêmico/interno.

## Contato

Para mais informações, entre em contato com a equipe de desenvolvimento.
