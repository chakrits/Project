### exercise1.c show the for-loop technique.
#### to print * in some shap as formula.
#### Example like this
```
    *     *
   **     **
  ***     ***
 ****     ****
*****     *****
```

#### in code you can see the systax in for-loop
``` C
for(i=1;i<=row;i++)
    {
        for(j=1;j<=row;j++)
        {
            if(j == i)
                printf("*");
            else
                printf(" ");
        }
        printf("\n");
 ```
 
